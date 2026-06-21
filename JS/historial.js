/*=========================================================
                    VENTECH
                    historial.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let historial = JSON.parse(localStorage.getItem("historial")) || [];

const tablaHistorial = document.getElementById("tablaHistorial");
const buscador = document.getElementById("buscarHistorial");
const filtroEstado = document.getElementById("filtroEstado");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    cargarHistorial();

    buscarCompras();

    filtrarCompras();

    cargarResumen();

});

/*=========================================================
                    CARGAR HISTORIAL
=========================================================*/

function cargarHistorial(){

    if(!tablaHistorial) return;

    tablaHistorial.innerHTML="";

    if(historial.length===0){

        tablaHistorial.innerHTML=`

        <tr>

            <td colspan="7" class="text-center">

                No existen compras registradas.

            </td>

        </tr>

        `;

        return;

    }

    historial.forEach((compra,index)=>{

        tablaHistorial.innerHTML+=`

        <tr>

            <td>${compra.id}</td>

            <td>${compra.fecha}</td>

            <td>${compra.cliente}</td>

            <td>${compra.metodo}</td>

            <td>$${compra.total.toLocaleString()}</td>

            <td>

                <span class="badge bg-success">

                    Completada

                </span>

            </td>

            <td>

                <button

                    class="btn btn-primary btn-sm ver"

                    data-index="${index}">

                    Ver

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

    document.querySelectorAll(".ver").forEach(btn=>{

        btn.addEventListener("click",verCompra);

    });

}

/*=========================================================
                    VER COMPRA
=========================================================*/

function verCompra(e){

    const index = e.target.dataset.index;

    const compra = historial[index];

    let detalle = `
Factura: ${compra.id}

Cliente: ${compra.cliente}

Fecha: ${compra.fecha}

Método: ${compra.metodo}

Total: $${compra.total.toLocaleString()}

Productos:

`;

    compra.productos.forEach(producto=>{

        detalle += `

• ${producto.nombre}

Cantidad: ${producto.cantidad}

Precio: $${producto.precio.toLocaleString()}

`;

    });

    alert(detalle);

}

/*=========================================================
                    BUSCAR
=========================================================*/

function buscarCompras(){

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const texto = buscador.value.toLowerCase();

        document.querySelectorAll("#tablaHistorial tr").forEach(fila=>{

            fila.style.display =

                fila.innerText.toLowerCase().includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                    FILTRO
=========================================================*/

function filtrarCompras(){

    if(!filtroEstado) return;

    filtroEstado.addEventListener("change",()=>{

        const estado=filtroEstado.value;

        document.querySelectorAll("#tablaHistorial tr").forEach(fila=>{

            if(estado===""){

                fila.style.display="";

            }else{

                fila.style.display=

                    fila.innerText.includes(estado)

                    ? ""

                    : "none";

            }

        });

    });

}

/*=========================================================
                    RESUMEN
=========================================================*/

function cargarResumen(){

    const compras = document.getElementById("totalCompras");

    const dinero = document.getElementById("totalGastado");

    if(compras){

        compras.textContent = historial.length;

    }

    if(dinero){

        const total = historial.reduce((suma,item)=>{

            return suma + item.total;

        },0);

        dinero.textContent = "$"+total.toLocaleString();

    }

}

/*=========================================================
                    EXPORTAR
=========================================================*/

const btnExportar = document.getElementById("btnExportar");

if(btnExportar){

    btnExportar.addEventListener("click",()=>{

        console.table(historial);

        mostrarMensaje(

            "Historial exportado correctamente.",

            "success"

        );

    });

}

/*=========================================================
                    IMPRIMIR
=========================================================*/

const btnImprimir = document.getElementById("btnImprimir");

if(btnImprimir){

    btnImprimir.addEventListener("click",()=>{

        window.print();

    });

}

/*=========================================================
                    MENSAJES
=========================================================*/

function mostrarMensaje(texto,tipo){

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
                    ACTUALIZAR
=========================================================*/

function actualizarHistorial(){

    historial = JSON.parse(

        localStorage.getItem("historial")

    ) || [];

    cargarHistorial();

    cargarResumen();

}

setInterval(actualizarHistorial,10000);

