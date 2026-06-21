/*=========================================================
                    VENTECH
                    productos.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let productos = JSON.parse(localStorage.getItem("productos")) || [];

const tabla = document.getElementById("tablaProductos");
const formulario = document.getElementById("formProducto");
const buscador = document.getElementById("buscarProducto");
const filtroCategoria = document.getElementById("filtroCategoria");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    listarProductos();

    registrarProducto();

    buscarProductos();

    filtrarCategoria();

    cargarResumen();

});

/*=========================================================
                    LISTAR PRODUCTOS
=========================================================*/

function listarProductos(){

    if(!tabla) return;

    tabla.innerHTML="";

    if(productos.length===0){

        tabla.innerHTML=`

        <tr>

            <td colspan="8" class="text-center">

                No hay productos registrados.

            </td>

        </tr>

        `;

        return;

    }

    productos.forEach((producto,index)=>{

        tabla.innerHTML+=`

        <tr>

            <td>${producto.codigo}</td>

            <td>

                <img src="${producto.imagen}"

                width="60"

                class="rounded">

            </td>

            <td>${producto.nombre}</td>

            <td>${producto.categoria}</td>

            <td>$${producto.precio.toLocaleString()}</td>

            <td>${producto.stock}</td>

            <td>

                ${estadoStock(producto.stock)}

            </td>

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

        btn.addEventListener("click",editarProducto);

    });

    document.querySelectorAll(".eliminar").forEach(btn=>{

        btn.addEventListener("click",eliminarProducto);

    });

}

/*=========================================================
                    REGISTRAR
=========================================================*/

function registrarProducto(){

    if(!formulario) return;

    formulario.addEventListener("submit",(e)=>{

        e.preventDefault();

        const producto={

            codigo:document.getElementById("codigo").value,

            nombre:document.getElementById("nombre").value,

            categoria:document.getElementById("categoria").value,

            precio:Number(document.getElementById("precio").value),

            stock:Number(document.getElementById("stock").value),

            imagen:document.getElementById("imagen").value

        };

        productos.push(producto);

        guardar();

        formulario.reset();

        listarProductos();

        cargarResumen();

        mensaje("Producto registrado.","success");

    });

}

/*=========================================================
                    EDITAR
=========================================================*/

function editarProducto(e){

    const index=e.target.dataset.index;

    const producto=productos[index];

    document.getElementById("codigo").value=producto.codigo;

    document.getElementById("nombre").value=producto.nombre;

    document.getElementById("categoria").value=producto.categoria;

    document.getElementById("precio").value=producto.precio;

    document.getElementById("stock").value=producto.stock;

    document.getElementById("imagen").value=producto.imagen;

    productos.splice(index,1);

    guardar();

    listarProductos();

}

/*=========================================================
                    ELIMINAR
=========================================================*/

function eliminarProducto(e){

    if(!confirm("¿Eliminar este producto?")) return;

    productos.splice(e.target.dataset.index,1);

    guardar();

    listarProductos();

    cargarResumen();

    mensaje("Producto eliminado.","danger");

}

/*=========================================================
                    BUSCAR
=========================================================*/

function buscarProductos(){

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const texto=buscador.value.toLowerCase();

        document.querySelectorAll("#tablaProductos tr").forEach(fila=>{

            fila.style.display=

                fila.innerText.toLowerCase().includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                    FILTRO CATEGORÍA
=========================================================*/

function filtrarCategoria(){

    if(!filtroCategoria) return;

    filtroCategoria.addEventListener("change",()=>{

        const categoria=filtroCategoria.value;

        document.querySelectorAll("#tablaProductos tr").forEach(fila=>{

            if(categoria===""){

                fila.style.display="";

            }else{

                fila.style.display=

                    fila.innerText.includes(categoria)

                    ? ""

                    : "none";

            }

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
                    RESUMEN
=========================================================*/

function cargarResumen(){

    const total=document.getElementById("totalProductos");

    const stock=document.getElementById("stockTotal");

    if(total){

        total.textContent=productos.length;

    }

    if(stock){

        const suma=productos.reduce((t,p)=>t+p.stock,0);

        stock.textContent=suma;

    }

}

/*=========================================================
                    GUARDAR
=========================================================*/

function guardar(){

    localStorage.setItem(

        "productos",

        JSON.stringify(productos)

    );

}

/*=========================================================
                    EXPORTAR
=========================================================*/

const btnExportar=document.getElementById("btnExportar");

if(btnExportar){

    btnExportar.addEventListener("click",()=>{

        console.table(productos);

        mensaje("Listado exportado.","info");

    });

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
                    ACTUALIZAR
=========================================================*/

setInterval(()=>{

    productos=JSON.parse(localStorage.getItem("productos")) || [];

    listarProductos();

    cargarResumen();

},10000);
