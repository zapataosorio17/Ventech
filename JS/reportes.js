/*=========================================================
                    VENTECH
                    reportes.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const tipoReporte = document.getElementById("tipoReporte");
const btnGenerar = document.getElementById("btnGenerar");
const btnExportarPDF = document.getElementById("btnPDF");
const btnExportarExcel = document.getElementById("btnExcel");
const tablaReportes = document.getElementById("tablaReportes");
const totalRegistros = document.getElementById("totalRegistros");
const totalVentas = document.getElementById("totalVentas");
const totalIngresos = document.getElementById("totalIngresos");

let reportes = JSON.parse(localStorage.getItem("ventas")) || [];

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    generarReporte();

    inicializarGrafica();

});

/*=========================================================
                    GENERAR REPORTE
=========================================================*/

function generarReporte(){

    if(!btnGenerar) return;

    btnGenerar.addEventListener("click",()=>{

        cargarTabla();

        actualizarResumen();

        mostrarMensaje("Reporte generado correctamente.","success");

    });

}

/*=========================================================
                    TABLA
=========================================================*/

function cargarTabla(){

    if(!tablaReportes) return;

    tablaReportes.innerHTML="";

    if(reportes.length===0){

        tablaReportes.innerHTML=`

        <tr>

            <td colspan="7" class="text-center">

                No existen datos disponibles.

            </td>

        </tr>

        `;

        return;

    }

    reportes.forEach(reporte=>{

        tablaReportes.innerHTML+=`

        <tr>

            <td>${reporte.factura}</td>

            <td>${reporte.cliente}</td>

            <td>${reporte.producto}</td>

            <td>${reporte.cantidad}</td>

            <td>$${reporte.total.toLocaleString()}</td>

            <td>${reporte.fecha}</td>

            <td>${reporte.estado}</td>

        </tr>

        `;

    });

}

/*=========================================================
                    RESUMEN
=========================================================*/

function actualizarResumen(){

    const ingresos = reportes.reduce((suma,item)=>{

        return suma + item.total;

    },0);

    if(totalRegistros){

        totalRegistros.textContent=reportes.length;

    }

    if(totalVentas){

        totalVentas.textContent=reportes.length;

    }

    if(totalIngresos){

        totalIngresos.textContent="$"+ingresos.toLocaleString();

    }

}

/*=========================================================
                    CHART.JS
=========================================================*/

function inicializarGrafica(){

    if(typeof Chart==="undefined") return;

    const canvas=document.getElementById("graficaReportes");

    if(!canvas) return;

    const meses=["Ene","Feb","Mar","Abr","May","Jun"];

    const datos=[15,22,18,35,40,55];

    new Chart(canvas,{

        type:"bar",

        data:{

            labels:meses,

            datasets:[{

                label:"Ventas",

                data:datos,

                backgroundColor:"#0d6efd"

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false

        }

    });

}

/*=========================================================
                    EXPORTAR PDF
=========================================================*/

if(btnExportarPDF){

    btnExportarPDF.addEventListener("click",()=>{

        mostrarMensaje("Exportando reporte en PDF...","info");

        console.table(reportes);

    });

}

/*=========================================================
                    EXPORTAR EXCEL
=========================================================*/

if(btnExportarExcel){

    btnExportarExcel.addEventListener("click",()=>{

        mostrarMensaje("Exportando reporte en Excel...","success");

        console.table(reportes);

    });

}

/*=========================================================
                    FILTRO POR FECHA
=========================================================*/

function filtrarFechas(){

    if(!fechaInicio || !fechaFin) return;

    console.log(

        "Desde:",fechaInicio.value,

        "Hasta:",fechaFin.value

    );

}

/*=========================================================
                    FILTRO POR TIPO
=========================================================*/

if(tipoReporte){

    tipoReporte.addEventListener("change",()=>{

        mostrarMensaje(

            "Tipo de reporte: "+tipoReporte.value,

            "secondary"

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
                    IMPRIMIR
=========================================================*/

function imprimirReporte(){

    window.print();

}

const btnImprimir=document.getElementById("btnImprimir");

if(btnImprimir){

    btnImprimir.addEventListener(

        "click",

        imprimirReporte

    );

}

/*=========================================================
                    ACTUALIZAR
=========================================================*/

function actualizarReporte(){

    reportes=JSON.parse(localStorage.getItem("ventas")) || [];

    cargarTabla();

    actualizarResumen();

}

setInterval(actualizarReporte,10000);

