const API_URL = 'http://localhost:3000';

LoadData();

async function LoadData() {
    try {
        // Lấy Posts và Comments cùng lúc
        let [resPosts, resComments] = await Promise.all([
            fetch(API_URL + '/posts'),
            fetch(API_URL + '/comments')
        ]);

        let posts = await resPosts.json();
        let comments = await resComments.json();

        let body = document.getElementById('post-body');
        body.innerHTML = "";

        // Duyệt ngược để bài mới nhất lên đầu
        // Sắp xếp bài xóa mềm xuống dưới cùng nếu muốn, hoặc để nguyên
        posts.reverse().forEach(post => {
            // Lọc comment của bài viết này
            let postComments = comments.filter(c => c.postId == post.id);
            body.innerHTML += convertDataToHTML(post, postComments);
        });

    } catch (error) {
        console.log(error);
    }
}

function convertDataToHTML(post, comments) {
    // 1. Xử lý hiển thị Xóa mềm
    const isDel = post.isDeleted;
    const rowClass = isDel ? 'deleted' : '';
    const btnLabel = isDel ? 'Khôi phục' : 'Xóa';
    // Nếu đã xóa -> gọi hàm Restore, chưa xóa -> gọi hàm Delete
    const actionFunc = isDel ? `RestorePost('${post.id}')` : `Delete('${post.id}')`;

    // 2. Xử lý hiển thị danh sách Comment
    let commentListHTML = '<ul style="list-style: none; padding: 0;">';
    comments.forEach(c => {
        const cmtStyle = c.isDeleted ? 'text-decoration: line-through; color: #ccc;' : '';
        commentListHTML += `
            <li style="border-bottom: 1px dashed #eee; margin-bottom: 5px; ${cmtStyle}">
                <b>#${c.id}:</b> ${c.text} 
                ${!c.isDeleted ? 
                    `<button onclick="DeleteComment('${c.id}')" style="color:red; font-size:10px; cursor:pointer;">x</button>` 
                    : ''}
            </li>
        `;
    });
    commentListHTML += '</ul>';

    // 3. Form thêm comment (Chỉ hiện khi Post chưa bị xóa)
    const addCommentHTML = !isDel ? `
        <div style="display:flex; gap:5px; margin-top:5px;">
            <input type="text" id="cmt-input-${post.id}" placeholder="Viết bình luận..." style="width:100%">
            <button onclick="AddComment('${post.id}')">Gửi</button>
        </div>
    ` : '<small>(Đã khóa bình luận)</small>';

    return `
        <tr class="${rowClass}">
            <td>${post.id}</td>
            <td onclick="fillForm('${post.id}', '${post.title}', '${post.views}')" style="cursor:pointer" title="Click để sửa">${post.title}</td>
            <td>${post.views}</td>
            <td>
                ${commentListHTML}
                ${addCommentHTML}
            </td>
            <td>
                <input type='button' value='${btnLabel}' onclick="${actionFunc}"/>
            </td>
        </tr>
    `;
}

// Hàm hỗ trợ điền dữ liệu lên form khi click vào tên bài viết
function fillForm(id, title, views) {
    document.getElementById("id_txt").value = id;
    document.getElementById("title_txt").value = title;
    document.getElementById("views_txt").value = views;
}

async function saveData() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let view = document.getElementById('views_txt').value;

    if(!title) { alert("Vui lòng nhập tiêu đề!"); return; }

    // === TRƯỜNG HỢP TẠO MỚI (ID RỖNG) ===
    if (id === "") {
        // Lấy danh sách để tính ID tự tăng
        let res = await fetch(API_URL + '/posts');
        let posts = await res.json();
        
        // Logic: Chuyển ID sang số -> Tìm Max -> Cộng 1 -> Chuyển về chuỗi
        let ids = posts.map(p => Number(p.id)).filter(n => !isNaN(n));
        let maxId = ids.length > 0 ? Math.max(...ids) : 0;
        let newId = (maxId + 1).toString();

        await fetch(API_URL + '/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: newId,
                title: title,
                views: view,
                isDeleted: false // Mặc định chưa xóa
            })
        });
        console.log("Tạo mới thành công");
    } 
    // === TRƯỜNG HỢP CẬP NHẬT (CÓ ID) ===
    else {
        // Dùng PATCH để chỉ sửa title và views, giữ nguyên isDeleted
        await fetch(API_URL + '/posts/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                views: view
            })
        });
        console.log("Cập nhật thành công");
    }

    // Reset form và load lại
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("views_txt").value = "";
    LoadData();
}

// === XÓA MỀM POST ===
async function Delete(id) {
    if(!confirm("Bạn chắc chắn muốn xóa bài này?")) return;
    await fetch(API_URL + '/posts/' + id, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true })
    });
    LoadData();
}

// === KHÔI PHỤC POST ===
async function RestorePost(id) {
    await fetch(API_URL + '/posts/' + id, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: false })
    });
    LoadData();
}

// === THÊM COMMENT ===
async function AddComment(postId) {
    let input = document.getElementById(`cmt-input-${postId}`);
    let text = input.value;
    if(!text) return alert("Vui lòng nhập nội dung!");

    // Tính ID cho comment
    let res = await fetch(API_URL + '/comments');
    let comments = await res.json();
    let ids = comments.map(c => Number(c.id)).filter(n => !isNaN(n));
    let newId = ((ids.length > 0 ? Math.max(...ids) : 0) + 1).toString();

    await fetch(API_URL + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: newId,
            postId: postId.toString(),
            text: text, // Lưu ý: db.json cũ của bạn dùng key là "text"
            isDeleted: false
        })
    });
    LoadData();
}

// === XÓA MỀM COMMENT ===
async function DeleteComment(cmtId) {
    if(!confirm("Xóa bình luận này?")) return;
    await fetch(API_URL + '/comments/' + cmtId, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDeleted: true })
    });
    LoadData();
}