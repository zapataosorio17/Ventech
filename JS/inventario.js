/*=========================================================
                    VENTECH
                    inventario.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

const tabla = document.getElementById("tablaInventario");
const formulario = document.getElementById("formInventario");
const buscador = document.getElementById("buscarInventario");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    listarInventario();

    buscarProducto();

    guardarProducto();

    cargarEstadisticas();

});

/*=========================================================
                    LISTAR PRODUCTOS
=========================================================*/

function listarInventario(){

    if(!tabla) return;

    tabla.innerHTML = "";

    if(inventario.length === 0){

        tabla.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    No hay productos registrados.
                </td>
            </tr>
        `;

        return;

    }

    inventario.forEach((producto,index)=>{

        tabla.innerHTML += `

        <tr>

            <td>${producto.codigo}</td>

            <td>${producto.nombre}</td>

            <td>${producto.categoria}</td>

            <td>$${producto.precio.toLocaleString()}</td>

            <td>${producto.stock}</td>

            <td>${estadoStock(producto.stock)}</td>

            <td>${producto.fecha}</td>

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

    document.querySelectorAll(".eliminar").forEach(btn=>{

        btn.addEventListener("click",eliminarProducto);

    });

    document.querySelectorAll(".editar").forEach(btn=>{

        btn.addEventListener("click",editarProducto);

    });

}

/*=========================================================
                    AGREGAR PRODUCTO
=========================================================*/

function guardarProducto(){

    if(!formulario) return;

    formulario.addEventListener("submit",(e)=>{

        e.preventDefault();

        const nuevo={

            codigo:document.getElementById("codigo").value,

            nombre:document.getElementById("nombre").value,

            categoria:document.getElementById("categoria").value,

            precio:Number(document.getElementById("precio").value),

            stock:Number(document.getElementById("stock").value),

            fecha:new Date().toLocaleDateString("es-CO")

        };

        inventario.push(nuevo);

        guardarLocal();

        formulario.reset();

        listarInventario();

        cargarEstadisticas();

        mensaje("Producto agregado correctamente.","success");

    });

}

/*=========================================================
                    ELIMINAR
=========================================================*/

function eliminarProducto(e){

    if(!confirm("¿Eliminar este producto?")) return;

    const index=e.target.dataset.index;

    inventario.splice(index,1);

    guardarLocal();

    listarInventario();

    cargarEstadisticas();

    mensaje("Producto eliminado.","danger");

}

/*=========================================================
                    EDITAR
=========================================================*/

function editarProducto(e){

    const index=e.target.dataset.index;

    const producto=inventario[index];

    document.getElementById("codigo").value=producto.codigo;

    document.getElementById("nombre").value=producto.nombre;

    document.getElementById("categoria").value=producto.categoria;

    document.getElementById("precio").value=producto.precio;

    document.getElementById("stock").value=producto.stock;

    inventario.splice(index,1);

    guardarLocal();

    listarInventario();

}

/*=========================================================
                    BUSCAR
=========================================================*/

function buscarProducto(){

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const texto=buscador.value.toLowerCase();

        document.querySelectorAll("#tablaInventario tr").forEach(fila=>{

            fila.style.display=fila.innerText.toLowerCase().includes(texto)

            ? ""

            : "none";

        });

    });

}

/*=========================================================
                    ESTADO STOCK
=========================================================*/

function estadoStock(stock){

    if(stock<=5){

        return '<span class="badge bg-danger">Bajo</span>';

    }

    if(stock<=20){

        return '<span class="badge bg-warning">Medio</span>';

    }

    return '<span class="badge bg-success">Alto</span>';

}

/*=========================================================
                    ESTADÍSTICAS
=========================================================*/

function cargarEstadisticas(){

    const total=document.getElementById("totalProductos");

    const bajo=document.getElementById("stockBajo");

    const valor=document.getElementById("valorInventario");

    if(total){

        total.textContent=inventario.length;

    }

    if(bajo){

        bajo.textContent=inventario.filter(p=>p.stock<=5).length;

    }

    if(valor){

        const suma=inventario.reduce((t,p)=>{

            return t+(p.precio*p.stock);

        },0);

        valor.textContent="$"+suma.toLocaleString();

    }

}

/*=========================================================
                    LOCAL STORAGE
=========================================================*/

function guardarLocal(){

    localStorage.setItem(

        "inventario",

        JSON.stringify(inventario)

    );

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
                    EXPORTAR
=========================================================*/

function exportarInventario(){

    console.table(inventario);

    mensaje("Inventario exportado.","info");

}

const btnExportar=document.getElementById("btnExportar");

if(btnExportar){

    btnExportar.addEventListener("click",exportarInventario);

}

