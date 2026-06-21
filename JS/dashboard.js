/*=========================================================
                    VENTECH
                    dashboard.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

const fechaActual = document.getElementById("fechaActual");
const reloj = document.getElementById("reloj");

const totalVentas = document.getElementById("totalVentas");
const totalProductos = document.getElementById("totalProductos");
const totalClientes = document.getElementById("totalClientes");
const totalIngresos = document.getElementById("totalIngresos");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    cargarFecha();

    iniciarReloj();

    cargarIndicadores();

    cargarGraficas();

    cargarActividad();

    cargarNotificaciones();

});

/*=========================================================
                    FECHA
=========================================================*/

function cargarFecha(){

    if(fechaActual){

        fechaActual.textContent=new Date().toLocaleDateString("es-CO",{

            weekday:"long",

            year:"numeric",

            month:"long",

            day:"numeric"

        });

    }

}

/*=========================================================
                    RELOJ
=========================================================*/

function iniciarReloj(){

    if(!reloj) return;

    setInterval(()=>{

        reloj.textContent=new Date().toLocaleTimeString("es-CO");

    },1000);

}

/*=========================================================
                    KPIs
=========================================================*/

function cargarIndicadores(){

    if(totalVentas){

        totalVentas.textContent="125";

    }

    if(totalProductos){

        totalProductos.textContent="350";

    }

    if(totalClientes){

        totalClientes.textContent="98";

    }

    if(totalIngresos){

        totalIngresos.textContent="$48.950.000";

    }

}

/*=========================================================
                    CHART VENTAS
=========================================================*/

function cargarGraficas(){

    if(typeof Chart==="undefined") return;

    const grafica=document.getElementById("graficaVentas");

    if(!grafica) return;

    new Chart(grafica,{

        type:"line",

        data:{

            labels:["Ene","Feb","Mar","Abr","May","Jun"],

            datasets:[{

                label:"Ventas",

                data:[12,20,18,30,40,52],

                borderColor:"#0d6efd",

                backgroundColor:"rgba(13,110,253,.15)",

                fill:true,

                tension:.4

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false

        }

    });

}

/*=========================================================
                    ACTIVIDAD
=========================================================*/

function cargarActividad(){

    const lista=document.getElementById("actividad");

    if(!lista) return;

    const actividades=[

        "Nueva venta registrada.",

        "Producto agregado al inventario.",

        "Cliente registrado.",

        "Factura generada.",

        "Stock actualizado."

    ];

    lista.innerHTML="";

    actividades.forEach(item=>{

        lista.innerHTML+=`

        <li class="list-group-item">

            ${item}

        </li>

        `;

    });

}

/*=========================================================
                    NOTIFICACIONES
=========================================================*/

function cargarNotificaciones(){

    const badge=document.getElementById("badgeNotificaciones");

    if(!badge) return;

    badge.textContent="5";

}

/*=========================================================
                    EXPORTAR REPORTE
=========================================================*/

function exportarReporte(){

    mostrarMensaje(

        "Reporte exportado correctamente.",

        "success"

    );

}

/*=========================================================
                    REFRESCAR
=========================================================*/

function refrescarDashboard(){

    cargarIndicadores();

    cargarActividad();

    mostrarMensaje(

        "Información actualizada.",

        "info"

    );

}

/*=========================================================
                    MENSAJES
=========================================================*/

function mostrarMensaje(texto,tipo){

    const mensaje=document.createElement("div");

    mensaje.className=`alert alert-${tipo}`;

    mensaje.innerHTML=texto;

    mensaje.style.position="fixed";

    mensaje.style.top="20px";

    mensaje.style.right="20px";

    mensaje.style.zIndex="9999";

    document.body.appendChild(mensaje);

    setTimeout(()=>{

        mensaje.remove();

    },3000);

}

/*=========================================================
                    CONTADORES
=========================================================*/

function animarContador(id,valor){

    const elemento=document.getElementById(id);

    if(!elemento) return;

    let contador=0;

    const intervalo=setInterval(()=>{

        contador++;

        elemento.textContent=contador;

        if(contador>=valor){

            clearInterval(intervalo);

        }

    },20);

}

/*=========================================================
                    ANIMACIONES
=========================================================*/

window.addEventListener("load",()=>{

    animarContador("totalVentas",125);

    animarContador("totalProductos",350);

    animarContador("totalClientes",98);

});

/*=========================================================
                    BOTONES
=========================================================*/

const btnActualizar=document.getElementById("btnActualizar");

if(btnActualizar){

    btnActualizar.addEventListener(

        "click",

        refrescarDashboard

    );

}

const btnReporte=document.getElementById("btnReporte");

if(btnReporte){

    btnReporte.addEventListener(

        "click",

        exportarReporte

    );

}

/*=========================================================
                    MODO OSCURO
=========================================================*/

const btnTema=document.getElementById("btnTema");

if(btnTema){

    btnTema.addEventListener("click",()=>{

        document.body.classList.toggle("dark-mode");

        localStorage.setItem(

            "tema",

            document.body.classList.contains("dark-mode")

        );

    });

}

/*=========================================================
                    CARGAR TEMA
=========================================================*/

if(localStorage.getItem("tema")==="true"){

    document.body.classList.add("dark-mode");

}

