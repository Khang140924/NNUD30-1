LoadData();
async function LoadData() {
    //async await 
    //HTTP Request GET, GET1, PUT, POST, DELETE
    try {
        let res = await fetch('http://localhost:3000/posts');
        let posts = await res.json();
        let body = document.getElementById('post-body')
        body.innerHTML = "";
        for (const post of posts) {
            body.innerHTML += convertDataToHTML(post);
        }
    } catch (error) {
        console.log(error);
    }

}
function convertDataToHTML(post) {
    return `<tr>
        <td>${post.id}<td>
        <td>${post.title}<td>
        <td>${post.views}<td>
        <td><input type='submit' value='delete' onclick='Delete(${post.id})'/><td>
    </tr>`
}
async function saveData() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let view = document.getElementById('views_txt').value;
    let resGET = await fetch('http://localhost:3000/posts/' + id)
    if (resGET.ok) {
        let resPUT = await fetch('http://localhost:3000/posts/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    title: title,
                    views: view
                })
        });
        if (resPUT.ok) {
            console.log("thanh cong");
        }
        return false;
    } else {
        //POST
        let resPOST = await fetch('http://localhost:3000/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    id: id,
                    title: title,
                    views: view
                })
        })
        if (resPOST.ok) {
            console.log("thanh cong");
        }
        return false;
    }



}
async function Delete(id) {
    let res = await fetch('http://localhost:3000/posts/' + id, {
        method: "delete"
    });
    if (res.ok) {
        console.log("xoa thanh cong");
        LoadData();
    }
}