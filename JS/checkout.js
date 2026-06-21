/*=========================================================
                    VENTECH
                    checkout.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const listaProductos = document.getElementById("listaProductos");
const subtotalHTML = document.getElementById("subtotal");
const ivaHTML = document.getElementById("iva");
const totalHTML = document.getElementById("total");
const formulario = document.getElementById("formCheckout");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    mostrarResumen();

    calcularTotales();

    procesarCompra();

});

/*=========================================================
                    MOSTRAR PRODUCTOS
=========================================================*/

function mostrarResumen(){

    if(!listaProductos) return;

    listaProductos.innerHTML="";

    if(carrito.length===0){

        listaProductos.innerHTML=`

        <li class="list-group-item text-center">

            No hay productos en el carrito.

        </li>

        `;

        return;

    }

    carrito.forEach(producto=>{

        listaProductos.innerHTML+=`

        <li class="list-group-item d-flex justify-content-between align-items-center">

            <div>

                <strong>${producto.nombre}</strong><br>

                Cantidad: ${producto.cantidad}

            </div>

            <span>

                $${(producto.precio*producto.cantidad).toLocaleString()}

            </span>

        </li>

        `;

    });

}

/*=========================================================
                    CALCULAR TOTALES
=========================================================*/

function calcularTotales(){

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

}

/*=========================================================
                    VALIDAR FORMULARIO
=========================================================*/

function validarFormulario(){

    const campos=formulario.querySelectorAll("[required]");

    let valido=true;

    campos.forEach(campo=>{

        if(campo.value.trim()===""){

            campo.classList.add("is-invalid");

            valido=false;

        }else{

            campo.classList.remove("is-invalid");

            campo.classList.add("is-valid");

        }

    });

    return valido;

}

/*=========================================================
                    PROCESAR COMPRA
=========================================================*/

function procesarCompra(){

    if(!formulario) return;

    formulario.addEventListener("submit",(e)=>{

        e.preventDefault();

        if(carrito.length===0){

            mensaje("El carrito está vacío.","danger");

            return;

        }

        if(!validarFormulario()){

            mensaje("Complete todos los campos.","warning");

            return;

        }

        const historial=JSON.parse(localStorage.getItem("historial")) || [];

        const factura={

            id:"FAC-"+Date.now(),

            fecha:new Date().toLocaleDateString("es-CO"),

            cliente:document.getElementById("nombre").value,

            correo:document.getElementById("correo").value,

            direccion:document.getElementById("direccion").value,

            metodo:document.getElementById("metodoPago").value,

            productos:carrito,

            total:obtenerTotal()

        };

        historial.push(factura);

        localStorage.setItem(

            "historial",

            JSON.stringify(historial)

        );

        localStorage.setItem(

            "ultimaFactura",

            JSON.stringify(factura)

        );

        localStorage.removeItem("carrito");

        mensaje("Compra realizada correctamente.","success");

        setTimeout(()=>{

            window.location.href="facturas.html";

        },2000);

    });

}

/*=========================================================
                    TOTAL
=========================================================*/

function obtenerTotal(){

    let total=0;

    carrito.forEach(producto=>{

        total+=producto.precio*producto.cantidad;

    });

    return total+(total*0.19);

}

/*=========================================================
                    MENSAJES
=========================================================*/

function mensaje(texto,tipo){

    const alerta=document.createElement("div");

    alerta.className=`alert alert-${tipo}`;

    alerta.style.position="fixed";

    alerta.style.top="20px";

    alerta.style.right="20px";

    alerta.style.zIndex="9999";

    alerta.innerHTML=texto;

    document.body.appendChild(alerta);

    setTimeout(()=>{

        alerta.remove();

    },3000);

}

/*=========================================================
                    CUPÓN
=========================================================*/

const btnCupon=document.getElementById("btnAplicarCupon");

if(btnCupon){

    btnCupon.addEventListener("click",()=>{

        const codigo=document.getElementById("cupon").value;

        if(codigo==="VENTECH10"){

            mensaje("Cupón aplicado (10%).","success");

        }else{

            mensaje("Cupón inválido.","danger");

        }

    });

}

/*=========================================================
                    AUTOCOMPLETAR
=========================================================*/

function cargarDatosCliente(){

    const usuario=JSON.parse(localStorage.getItem("usuario"));

    if(!usuario) return;

    document.getElementById("nombre").value=usuario.nombre;

    document.getElementById("correo").value=usuario.correo;

}

cargarDatosCliente();
