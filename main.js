const API_URL = 'http://localhost:3000';

// === BIẾN TOÀN CỤC ===
let globalPosts = [];    // Chứa tất cả bài viết
let globalComments = []; // Chứa tất cả bình luận
let config = {
    page: 1,         // Trang hiện tại
    limit: 5,        // Số dòng mỗi trang
    search: '',      // Từ khóa tìm kiếm
    sortBy: 'id',    // Cột sắp xếp (id, title, views)
    sortOrder: 'desc' // Thứ tự: asc (tăng), desc (giảm)
};

LoadData();

// === 1. TẢI DỮ LIỆU ===
async function LoadData() {
    try {
        let [resPosts, resComments] = await Promise.all([
            fetch(API_URL + '/posts'),
            fetch(API_URL + '/comments')
        ]);
        globalPosts = await resPosts.json();
        globalComments = await resComments.json();

        // Gọi hàm hiển thị sau khi có dữ liệu
        renderTable();
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
    }
}

// === 2. XỬ LÝ & HIỂN THỊ (QUAN TRỌNG NHẤT) ===
function renderTable() {
    // A. LỌC (SEARCH)
    let filtered = globalPosts.filter(p =>
        p.title.toLowerCase().includes(config.search.toLowerCase())
    );

    // B. SẮP XẾP (SORT)
    filtered.sort((a, b) => {
        let valA = a[config.sortBy];
        let valB = b[config.sortBy];

        // Xử lý đặc biệt cho Views và ID (chuyển về số để so sánh đúng)
        if (config.sortBy === 'views' || config.sortBy === 'id') {
            valA = Number(valA) || 0; // Nếu lỗi/rỗng thì tính là 0
            valB = Number(valB) || 0;
        } else {
            // Chuyển về chữ thường nếu là Title
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
        }

        if (valA < valB) return config.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return config.sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    // C. PHÂN TRANG (PAGINATION)
    let totalItems = filtered.length;
    let totalPages = Math.ceil(totalItems / config.limit);

    // Nếu trang hiện tại lớn hơn tổng trang -> lùi về trang cuối
    if (config.page > totalPages) config.page = totalPages > 0 ? totalPages : 1;

    let start = (config.page - 1) * config.limit;
    let end = start + config.limit;
    let pageData = filtered.slice(start, end);

    // D. RENDER HTML
    let tbody = document.querySelector('#post-table tbody') || document.getElementById('post-body');
    // Lưu ý: ID trong file HTML của bạn là gì thì sửa lại dòng trên (ví dụ 'post-body')

    tbody.innerHTML = "";

    if (pageData.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Không tìm thấy dữ liệu</td></tr>";
    }

    pageData.forEach(post => {
        let postComments = globalComments.filter(c => c.postId == post.id);
        tbody.innerHTML += convertDataToHTML(post, postComments);
    });

    // E. VẼ NÚT PHÂN TRANG
    renderPagination(totalPages);
}

// === 3. CÁC HÀM SỰ KIỆN ===
function handleSearch(val) {
    config.search = val.trim();
    config.page = 1; // Reset về trang 1 khi tìm kiếm
    renderTable();
}

function handleSort(val) {
    let [field, order] = val.split('-');
    config.sortBy = field;
    config.sortOrder = order;
    renderTable();
}

function handlePageSize(val) {
    config.limit = Number(val);
    config.page = 1;
    renderTable();
}

function changePage(page) {
    config.page = page;
    renderTable();
}

// === 4. VẼ NÚT PHÂN TRANG ===
function renderPagination(totalPages) {
    let div = document.getElementById('pagination');
    let html = '';

    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            let activeClass = (i === config.page) ? 'active' : '';
            html += `<button class="${activeClass}" onclick="changePage(${i})">${i}</button>`;
        }
    }
    div.innerHTML = html;
}

// === 5. CÁC HÀM CRUD (GIỮ NGUYÊN LOGIC CŨ) ===
function convertDataToHTML(post, comments) {
    const isDel = post.isDeleted;
    const btnLabel = isDel ? '♻️ Khôi phục' : '🗑️ Xóa';
    const actionFunc = isDel ? `RestorePost('${post.id}')` : `Delete('${post.id}')`;
    const rowDecoration = isDel ? 'opacity: 0.5;' : '';

    // Render danh sách comment
    let commentList = comments.map(c => {
        let style = c.isDeleted ? 'text-decoration: line-through; color: #888;' : '';
        let delBtn = !c.isDeleted ?
            `<button onclick="DeleteComment('${c.id}')" style="color:red; border:none; background:none; cursor:pointer;">x</button>` : '';
        return `<li style="${style}"><b>User:</b> ${c.text} ${delBtn}</li>`;
    }).join('');

    // Form thêm comment
    let addCmtForm = !isDel ? `
        <div style="display:flex; margin-top:5px;">
            <input type="text" id="cmt-input-${post.id}" placeholder="Bình luận..." style="width:70%">
            <button onclick="AddComment('${post.id}')" style="width:30%">Gửi</button>
        </div>` : '<small><i>Đã khóa</i></small>';

    return `
        <tr style="${rowDecoration}">
            <td>${post.id}</td>
            <td onclick="fillForm('${post.id}', '${post.title}', '${post.views}')" style="cursor:pointer; font-weight:bold;">
                ${post.title} ${isDel ? '(Đã xóa)' : ''}
            </td>
            <td>${post.views}</td>
            <td>
                <ul style="padding-left: 15px; margin: 0;">${commentList}</ul>
                ${addCmtForm}
            </td>
            <td>
                <button onclick="${actionFunc}">${btnLabel}</button>
            </td>
        </tr>
    `;
}

// Điền dữ liệu lên form
function fillForm(id, title, views) {
    document.getElementById("id_txt").value = id;
    document.getElementById("title_txt").value = title;
    document.getElementById("views_txt").value = views;
}

// Lưu (Thêm mới hoặc Cập nhật)
async function saveData() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let view = document.getElementById('views_txt').value;

    if (!title) { alert("Vui lòng nhập tiêu đề!"); return; }

    if (id === "") { // THÊM MỚI
        // Tạo ID tự tăng
        let maxId = globalPosts.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
        let newId = (maxId + 1).toString();

        await fetch(API_URL + '/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: newId, title: title, views: view, isDeleted: false })
        });
    } else { // CẬP NHẬT
        await fetch(API_URL + '/posts/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, views: view })
        });
    }

    // Reset form
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("views_txt").value = "";
    LoadData(); // Load lại để cập nhật bảng
}

// Xóa bài viết
async function Delete(id) {
    if (!confirm("Xóa bài viết này?")) return;
    await fetch(API_URL + '/posts/' + id, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true })
    });
    LoadData();
}

// Khôi phục bài viết
async function RestorePost(id) {
    await fetch(API_URL + '/posts/' + id, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false })
    });
    LoadData();
}

// Thêm comment
async function AddComment(postId) {
    let input = document.getElementById(`cmt-input-${postId}`);
    let text = input.value;
    if (!text) return alert("Chưa nhập nội dung!");

    // Tạo ID comment tự tăng
    let maxId = globalComments.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
    let newId = (maxId + 1).toString();

    await fetch(API_URL + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, postId: postId.toString(), text: text, isDeleted: false })
    });
    LoadData();
}

// Xóa comment
async function DeleteComment(cmtId) {
    if (!confirm("Xóa bình luận?")) return;
    await fetch(API_URL + '/comments/' + cmtId, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true })
    });
    LoadData();
}