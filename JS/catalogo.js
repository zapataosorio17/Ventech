/*=========================================================
                    VENTECH
                    catalogo.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let productos = [];
let productosFiltrados = [];

const contenedor = document.getElementById("contenedorProductos");
const buscador = document.getElementById("buscarProducto");
const categoria = document.getElementById("categoria");
const ordenar = document.getElementById("ordenar");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    cargarProductos();

    inicializarEventos();

});

/*=========================================================
                    PRODUCTOS
=========================================================*/

function cargarProductos(){

    productos=[

        {
            id:1,
            nombre:"Laptop Gamer ASUS",
            categoria:"Laptops",
            precio:4200000,
            imagen:"img/productos/laptop1.jpg"
        },

        {
            id:2,
            nombre:"Mouse Logitech G502",
            categoria:"Accesorios",
            precio:250000,
            imagen:"img/productos/mouse1.jpg"
        },

        {
            id:3,
            nombre:"Teclado Mecánico RGB",
            categoria:"Accesorios",
            precio:320000,
            imagen:"img/productos/teclado1.jpg"
        },

        {
            id:4,
            nombre:"Monitor 27 Pulgadas",
            categoria:"Monitores",
            precio:1200000,
            imagen:"img/productos/monitor1.jpg"
        },

        {
            id:5,
            nombre:"Audífonos Gamer",
            categoria:"Audio",
            precio:450000,
            imagen:"img/productos/audifonos1.jpg"
        },

        {
            id:6,
            nombre:"PC Gamer Ryzen 7",
            categoria:"Computadores",
            precio:6500000,
            imagen:"img/productos/pc1.jpg"
        }

    ];

    productosFiltrados=[...productos];

    mostrarProductos();

}

/*=========================================================
                    MOSTRAR PRODUCTOS
=========================================================*/

function mostrarProductos(){

    if(!contenedor) return;

    contenedor.innerHTML="";

    if(productosFiltrados.length===0){

        contenedor.innerHTML=`

        <div class="col-12">

            <div class="alert alert-warning">

                No se encontraron productos.

            </div>

        </div>

        `;

        return;

    }

    productosFiltrados.forEach(producto=>{

        contenedor.innerHTML+=`

        <div class="col-lg-4 col-md-6 mb-4">

            <div class="card h-100 shadow-sm product-card">

                <img src="${producto.imagen}"

                     class="card-img-top"

                     alt="${producto.nombre}">

                <div class="card-body">

                    <h5>${producto.nombre}</h5>

                    <p class="text-primary fw-bold">

                        ${formatoPrecio(producto.precio)}

                    </p>

                    <span class="badge bg-primary">

                        ${producto.categoria}

                    </span>

                </div>

                <div class="card-footer bg-white">

                    <button

                        class="btn btn-primary w-100 agregar"

                        data-id="${producto.id}">

                        Agregar al carrito

                    </button>

                </div>

            </div>

        </div>

        `;

    });

    eventosAgregar();

}

/*=========================================================
                    EVENTOS
=========================================================*/

function inicializarEventos(){

    if(buscador){

        buscador.addEventListener("keyup",filtrar);

    }

    if(categoria){

        categoria.addEventListener("change",filtrar);

    }

    if(ordenar){

        ordenar.addEventListener("change",ordenarProductos);

    }

}

/*=========================================================
                    FILTRAR
=========================================================*/

function filtrar(){

    const texto = buscador ? buscador.value.toLowerCase() : "";

    const cat = categoria ? categoria.value : "";

    productosFiltrados = productos.filter(producto=>{

        const coincideNombre =

            producto.nombre.toLowerCase().includes(texto);

        const coincideCategoria =

            cat==="" || producto.categoria===cat;

        return coincideNombre && coincideCategoria;

    });

    mostrarProductos();

}

/*=========================================================
                    ORDENAR
=========================================================*/

function ordenarProductos(){

    const opcion = ordenar.value;

    switch(opcion){

        case "precioAsc":

            productosFiltrados.sort((a,b)=>a.precio-b.precio);

        break;

        case "precioDesc":

            productosFiltrados.sort((a,b)=>b.precio-a.precio);

        break;

        case "nombre":

            productosFiltrados.sort((a,b)=>

                a.nombre.localeCompare(b.nombre)

            );

        break;

    }

    mostrarProductos();

}

/*=========================================================
                    AGREGAR AL CARRITO
=========================================================*/

function eventosAgregar(){

    document.querySelectorAll(".agregar").forEach(btn=>{

        btn.addEventListener("click",()=>{

            const id = Number(btn.dataset.id);

            agregarCarrito(id);

        });

    });

}

function agregarCarrito(id){

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const producto = productos.find(p=>p.id===id);

    const existe = carrito.find(p=>p.id===id);

    if(existe){

        existe.cantidad++;

    }else{

        carrito.push({

            ...producto,

            cantidad:1

        });

    }

    localStorage.setItem(

        "carrito",

        JSON.stringify(carrito)

    );

    actualizarContador();

    mostrarMensaje("Producto agregado al carrito.","success");

}

/*=========================================================
                    CONTADOR
=========================================================*/

function actualizarContador(){

    const contador=document.getElementById("cartCount");

    if(!contador) return;

    const carrito=

        JSON.parse(localStorage.getItem("carrito")) || [];

    contador.textContent=carrito.length;

}

/*=========================================================
                    FORMATO PRECIO
=========================================================*/

function formatoPrecio(valor){

    return new Intl.NumberFormat("es-CO",{

        style:"currency",

        currency:"COP"

    }).format(valor);

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

    },2500);

}

/*=========================================================
                    ACTUALIZAR CONTADOR
=========================================================*/

actualizarContador();
