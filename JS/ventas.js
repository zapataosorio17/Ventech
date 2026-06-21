/*=========================================================
                    VENTECH
                    ventas.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let ventas = JSON.parse(localStorage.getItem("ventas")) || [];

const tablaVentas = document.getElementById("tablaVentas");
const formularioVenta = document.getElementById("formVenta");
const buscadorVenta = document.getElementById("buscarVenta");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    listarVentas();

    registrarVenta();

    buscarVenta();

    cargarResumen();

});

/*=========================================================
                    LISTAR VENTAS
=========================================================*/

function listarVentas(){

    if(!tablaVentas) return;

    tablaVentas.innerHTML="";

    if(ventas.length===0){

        tablaVentas.innerHTML=`

        <tr>

            <td colspan="8" class="text-center">

                No existen ventas registradas.

            </td>

        </tr>

        `;

        return;

    }

    ventas.forEach((venta,index)=>{

        tablaVentas.innerHTML+=`

        <tr>

            <td>${venta.factura}</td>

            <td>${venta.cliente}</td>

            <td>${venta.producto}</td>

            <td>${venta.cantidad}</td>

            <td>$${venta.total.toLocaleString()}</td>

            <td>${venta.fecha}</td>

            <td>${venta.estado}</td>

            <td>

                <button
                    class="btn btn-warning btn-sm editar"
                    data-index="${index}">

                    Editar

                </button>

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

    document.querySelectorAll(".editar").forEach(btn=>{

        btn.addEventListener("click",editarVenta);

    });

    document.querySelectorAll(".eliminar").forEach(btn=>{

        btn.addEventListener("click",eliminarVenta);

    });

}

/*=========================================================
                    REGISTRAR VENTA
=========================================================*/

function registrarVenta(){

    if(!formularioVenta) return;

    formularioVenta.addEventListener("submit",(e)=>{

        e.preventDefault();

        const venta={

            factura:"FAC-"+Date.now(),

            cliente:document.getElementById("cliente").value,

            producto:document.getElementById("producto").value,

            cantidad:Number(document.getElementById("cantidad").value),

            total:Number(document.getElementById("total").value),

            fecha:new Date().toLocaleDateString("es-CO"),

            estado:"Pagada"

        };

        ventas.push(venta);

        guardarVentas();

        formularioVenta.reset();

        listarVentas();

        cargarResumen();

        mostrarMensaje("Venta registrada correctamente.","success");

    });

}

/*=========================================================
                    EDITAR
=========================================================*/

function editarVenta(e){

    const index=e.target.dataset.index;

    const venta=ventas[index];

    document.getElementById("cliente").value=venta.cliente;

    document.getElementById("producto").value=venta.producto;

    document.getElementById("cantidad").value=venta.cantidad;

    document.getElementById("total").value=venta.total;

    ventas.splice(index,1);

    guardarVentas();

    listarVentas();

}

/*=========================================================
                    ELIMINAR
=========================================================*/

function eliminarVenta(e){

    if(!confirm("¿Desea eliminar la venta?")) return;

    const index=e.target.dataset.index;

    ventas.splice(index,1);

    guardarVentas();

    listarVentas();

    cargarResumen();

    mostrarMensaje("Venta eliminada.","danger");

}

/*=========================================================
                    BUSCAR
=========================================================*/

function buscarVenta(){

    if(!buscadorVenta) return;

    buscadorVenta.addEventListener("keyup",()=>{

        const texto=buscadorVenta.value.toLowerCase();

        document.querySelectorAll("#tablaVentas tr").forEach(fila=>{

            fila.style.display=

                fila.innerText.toLowerCase().includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                    RESUMEN
=========================================================*/

function cargarResumen(){

    const totalVentas=document.getElementById("ventasHoy");

    const ingresos=document.getElementById("ingresos");

    const promedio=document.getElementById("promedioVenta");

    if(totalVentas){

        totalVentas.textContent=ventas.length;

    }

    const suma=ventas.reduce((t,v)=>t+v.total,0);

    if(ingresos){

        ingresos.textContent="$"+suma.toLocaleString();

    }

    if(promedio){

        promedio.textContent=ventas.length

            ? "$"+Math.round(suma/ventas.length).toLocaleString()

            : "$0";

    }

}

/*=========================================================
                    EXPORTAR
=========================================================*/

function exportarVentas(){

    console.table(ventas);

    mostrarMensaje(

        "Reporte de ventas exportado.",

        "info"

    );

}

const btnExportar=document.getElementById("btnExportar");

if(btnExportar){

    btnExportar.addEventListener(

        "click",

        exportarVentas

    );

}

/*=========================================================
                    LOCAL STORAGE
=========================================================*/

function guardarVentas(){

    localStorage.setItem(

        "ventas",

        JSON.stringify(ventas)

    );

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
                    FILTRO POR ESTADO
=========================================================*/

const filtroEstado=document.getElementById("filtroEstado");

if(filtroEstado){

    filtroEstado.addEventListener("change",()=>{

        const estado=filtroEstado.value;

        document.querySelectorAll("#tablaVentas tr").forEach(fila=>{

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

