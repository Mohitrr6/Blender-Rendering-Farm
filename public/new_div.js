function createNewDiv() {
    var projectListDiv = document.querySelector(".project_list");
    var newDiv = document.createElement("div");
    newDiv.classList.add("new_div");
    newDiv.textContent = "New Project";

    // Get the first child of the projectListDiv
    var firstChild = projectListDiv.firstChild;

    // Insert the newDiv before the firstChild
    projectListDiv.insertBefore(newDiv, firstChild);
}


