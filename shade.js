const shade = document.getElementById("shade")
let shadeMode = ""
let shadeClickOut = true; 

shade.addEventListener("click", (event) => {
    if (shadeClickOut && event.target === shade) {
        closeDisplay()
    }
})

function display(id, clickOut=false) {
    shadeMode = id
    shadeClickOut = clickOut
    document.getElementById(shadeMode).style.display = "block"
    shade.style.display = "block"
}

function closeDisplay() {
    shade.style.display = "none"
    document.getElementById(shadeMode).style.display = "none"
}