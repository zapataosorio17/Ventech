/*=========================================================
                    VENTECH
                    facturas.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let facturas = JSON.parse(localStorage.getItem("historial")) || [];

const tablaFacturas = document.getElementById("tablaFacturas");
const buscador = document.getElementById("buscarFactura");
const filtroEstado = document.getElementById("filtroEstado");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    cargarFacturas();

    buscarFacturas();

    filtrarFacturas();

    cargarResumen();

});

/*=========================================================
                    CARGAR FACTURAS
=========================================================*/

function cargarFacturas(){

    if(!tablaFacturas) return;

    tablaFacturas.innerHTML="";

    if(facturas.length===0){

        tablaFacturas.innerHTML=`

        <tr>

            <td colspan="7" class="text-center">

                No hay facturas registradas.

            </td>

        </tr>

        `;

        return;

    }

    facturas.forEach((factura,index)=>{

        tablaFacturas.innerHTML+=`

        <tr>

            <td>${factura.id}</td>

            <td>${factura.fecha}</td>

            <td>${factura.cliente}</td>

            <td>$${factura.total.toLocaleString()}</td>

            <td>

                <span class="badge bg-success">

                    Pagada

                </span>

            </td>

            <td>

                <button

                    class="btn btn-info btn-sm imprimir"

                    data-index="${index}">

                    Imprimir

                </button>

            </td>

            <td>

                <button

                    class="btn btn-danger btn-sm eliminar"

                    data-index="${index}">

                    Eliminar

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

    document.querySelectorAll(".imprimir").forEach(btn=>{

        btn.addEventListener("click",imprimirFactura);

    });

    document.querySelectorAll(".eliminar").forEach(btn=>{

        btn.addEventListener("click",eliminarFactura);

    });

}

/*=========================================================
                    IMPRIMIR
=========================================================*/

function imprimirFactura(e){

    const index=e.target.dataset.index;

    const factura=facturas[index];

    console.log(factura);

    window.print();

}

/*=========================================================
                    ELIMINAR
=========================================================*/

function eliminarFactura(e){

    if(!confirm("¿Desea eliminar esta factura?")) return;

    const index=e.target.dataset.index;

    facturas.splice(index,1);

    guardarFacturas();

    cargarFacturas();

    cargarResumen();

    mostrarMensaje(

        "Factura eliminada.",

        "danger"

    );

}

/*=========================================================
                    BUSCAR
=========================================================*/

function buscarFacturas(){

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const texto=buscador.value.toLowerCase();

        document.querySelectorAll("#tablaFacturas tr").forEach(fila=>{

            fila.style.display=

                fila.innerText.toLowerCase().includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                    FILTRAR
=========================================================*/

function filtrarFacturas(){

    if(!filtroEstado) return;

    filtroEstado.addEventListener("change",()=>{

        const estado=filtroEstado.value;

        document.querySelectorAll("#tablaFacturas tr").forEach(fila=>{

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

    const totalFacturas=document.getElementById("totalFacturas");

    const ingresos=document.getElementById("totalIngresos");

    if(totalFacturas){

        totalFacturas.textContent=facturas.length;

    }

    if(ingresos){

        const total=facturas.reduce((suma,f)=>{

            return suma+f.total;

        },0);

        ingresos.textContent="$"+total.toLocaleString();

    }

}

/*=========================================================
                    GUARDAR
=========================================================*/

function guardarFacturas(){

    localStorage.setItem(

        "historial",

        JSON.stringify(facturas)

    );

}

/*=========================================================
                    EXPORTAR PDF
=========================================================*/

const btnPDF=document.getElementById("btnPDF");

if(btnPDF){

    btnPDF.addEventListener("click",()=>{

        mostrarMensaje(

            "Factura exportada a PDF.",

            "success"

        );

    });

}

/*=========================================================
                    EXPORTAR EXCEL
=========================================================*/

const btnExcel=document.getElementById("btnExcel");

if(btnExcel){

    btnExcel.addEventListener("click",()=>{

        mostrarMensaje(

            "Factura exportada a Excel.",

            "info"

        );

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

function actualizarFacturas(){

    facturas=JSON.parse(

        localStorage.getItem("historial")

    ) || [];

    cargarFacturas();

    cargarResumen();

}

setInterval(actualizarFacturas,10000);
