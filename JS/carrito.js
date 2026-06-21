/*=========================================================
                    VENTECH
                    carrito.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const contenedor = document.getElementById("listaCarrito");
const subtotalHTML = document.getElementById("subtotal");
const ivaHTML = document.getElementById("iva");
const totalHTML = document.getElementById("total");
const contador = document.getElementById("cartCount");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    mostrarCarrito();

    actualizarTotales();

});

/*=========================================================
                    MOSTRAR CARRITO
=========================================================*/

function mostrarCarrito(){

    if(!contenedor) return;

    contenedor.innerHTML="";

    if(carrito.length===0){

        contenedor.innerHTML=`

        <tr>

            <td colspan="6" class="text-center">

                El carrito está vacío.

            </td>

        </tr>

        `;

        return;

    }

    carrito.forEach((producto,index)=>{

        contenedor.innerHTML+=`

        <tr>

            <td>

                <img src="${producto.imagen}"

                width="70"

                class="rounded">

            </td>

            <td>${producto.nombre}</td>

            <td>$${producto.precio.toLocaleString()}</td>

            <td>

                <input

                type="number"

                min="1"

                value="${producto.cantidad}"

                class="form-control cantidad"

                data-index="${index}">

            </td>

            <td>

                $${(producto.precio*producto.cantidad).toLocaleString()}

            </td>

            <td>

                <button

                class="btn btn-danger btnEliminar"

                data-index="${index}">

                <i class="bi bi-trash"></i>

                </button>

            </td>

        </tr>

        `;

    });

    eventos();

}

/*=========================================================
                    EVENTOS
=========================================================*/

function eventos(){

    document.querySelectorAll(".btnEliminar").forEach(btn=>{

        btn.addEventListener("click",eliminarProducto);

    });

    document.querySelectorAll(".cantidad").forEach(input=>{

        input.addEventListener("change",actualizarCantidad);

    });

}

/*=========================================================
                    ELIMINAR
=========================================================*/

function eliminarProducto(e){

    const index=e.target.closest("button").dataset.index;

    carrito.splice(index,1);

    guardar();

    mostrarCarrito();

    actualizarTotales();

    toast("Producto eliminado");

}

/*=========================================================
                    CANTIDAD
=========================================================*/

function actualizarCantidad(e){

    const index=e.target.dataset.index;

    carrito[index].cantidad=parseInt(e.target.value);

    guardar();

    mostrarCarrito();

    actualizarTotales();

}

/*=========================================================
                    TOTALES
=========================================================*/

function actualizarTotales(){

    let subtotal=0;

    carrito.forEach(producto=>{

        subtotal+=producto.precio*producto.cantidad;

    });

    const iva=subtotal*0.19;

    const total=subtotal+iva;

    if(subtotalHTML)

        subtotalHTML.textContent="$"+subtotal.toLocaleString();

    if(ivaHTML)

        ivaHTML.textContent="$"+iva.toLocaleString();

    if(totalHTML)

        totalHTML.textContent="$"+total.toLocaleString();

    if(contador)

        contador.textContent=carrito.length;

}

/*=========================================================
                    GUARDAR
=========================================================*/

function guardar(){

    localStorage.setItem(

        "carrito",

        JSON.stringify(carrito)

    );

}

/*=========================================================
                    VACIAR
=========================================================*/

const btnVaciar=document.getElementById("vaciarCarrito");

if(btnVaciar){

    btnVaciar.addEventListener("click",()=>{

        if(confirm("¿Desea vaciar el carrito?")){

            carrito=[];

            guardar();

            mostrarCarrito();

            actualizarTotales();

            toast("Carrito vaciado");

        }

    });

}

/*=========================================================
                    CHECKOUT
=========================================================*/

const btnComprar=document.getElementById("btnComprar");

if(btnComprar){

    btnComprar.addEventListener("click",()=>{

        if(carrito.length===0){

            toast("El carrito está vacío");

            return;

        }

        localStorage.setItem(

            "ultimaCompra",

            JSON.stringify(carrito)

        );

        window.location.href="checkout.html";

    });

}

/*=========================================================
                    CUPÓN
=========================================================*/

const btnCupon=document.getElementById("btnCupon");

if(btnCupon){

    btnCupon.addEventListener("click",()=>{

        const codigo=document.getElementById("codigoCupon").value;

        if(codigo==="VENTECH10"){

            toast("Cupón aplicado (10%)");

        }else{

            toast("Cupón inválido");

        }

    });

}

/*=========================================================
                    TOAST
=========================================================*/

function toast(texto){

    const div=document.createElement("div");

    div.className="toast-custom";

    div.innerHTML=texto;

    document.body.appendChild(div);

    setTimeout(()=>{

        div.classList.add("show");

    },100);

    setTimeout(()=>{

        div.remove();

    },3000);

}
