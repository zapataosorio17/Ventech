/*=========================================================
                    VENTECH
                    producto.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let producto = null;

const imagenPrincipal = document.getElementById("imagenPrincipal");
const miniaturas = document.querySelectorAll(".miniatura");
const cantidad = document.getElementById("cantidad");
const btnMas = document.getElementById("btnMas");
const btnMenos = document.getElementById("btnMenos");
const btnAgregar = document.getElementById("btnAgregar");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    cargarProducto();

    cambiarImagen();

    controlarCantidad();

    agregarCarrito();

});

/*=========================================================
                    CARGAR PRODUCTO
=========================================================*/

function cargarProducto(){

    producto={

        id:1,

        nombre:"Laptop Gamer ASUS ROG",

        categoria:"Laptops",

        precio:4200000,

        stock:15,

        imagen:"img/productos/laptop1.jpg"

    };

    actualizarInformacion();

}

function actualizarInformacion(){

    const nombre=document.getElementById("nombreProducto");
    const precio=document.getElementById("precioProducto");
    const stock=document.getElementById("stockProducto");

    if(nombre)
        nombre.textContent=producto.nombre;

    if(precio)
        precio.textContent=formatoPrecio(producto.precio);

    if(stock)
        stock.textContent=producto.stock+" disponibles";

    if(imagenPrincipal)
        imagenPrincipal.src=producto.imagen;

}

/*=========================================================
                    CAMBIAR IMAGEN
=========================================================*/

function cambiarImagen(){

    miniaturas.forEach(img=>{

        img.addEventListener("click",()=>{

            imagenPrincipal.src=img.src;

            miniaturas.forEach(i=>{

                i.classList.remove("active");

            });

            img.classList.add("active");

        });

    });

}

/*=========================================================
                    CANTIDAD
=========================================================*/

function controlarCantidad(){

    if(btnMas){

        btnMas.addEventListener("click",()=>{

            cantidad.value=parseInt(cantidad.value)+1;

        });

    }

    if(btnMenos){

        btnMenos.addEventListener("click",()=>{

            if(parseInt(cantidad.value)>1){

                cantidad.value=parseInt(cantidad.value)-1;

            }

        });

    }

}

/*=========================================================
                    AGREGAR CARRITO
=========================================================*/

function agregarCarrito(){

    if(!btnAgregar) return;

    btnAgregar.addEventListener("click",()=>{

        let carrito=JSON.parse(

            localStorage.getItem("carrito")

        ) || [];

        const existe=carrito.find(

            item=>item.id===producto.id

        );

        if(existe){

            existe.cantidad+=parseInt(cantidad.value);

        }else{

            carrito.push({

                ...producto,

                cantidad:parseInt(cantidad.value)

            });

        }

        localStorage.setItem(

            "carrito",

            JSON.stringify(carrito)

        );

        actualizarContador();

        mensaje(

            "Producto agregado al carrito.",

            "success"

        );

    });

}

/*=========================================================
                    CONTADOR
=========================================================*/

function actualizarContador(){

    const contador=document.getElementById("cartCount");

    if(!contador) return;

    const carrito=JSON.parse(

        localStorage.getItem("carrito")

    ) || [];

    contador.textContent=carrito.length;

}

/*=========================================================
                    PRODUCTOS RELACIONADOS
=========================================================*/

function cargarRelacionados(){

    const contenedor=document.getElementById(

        "productosRelacionados"

    );

    if(!contenedor) return;

    for(let i=1;i<=4;i++){

        contenedor.innerHTML+=`

        <div class="col-md-3">

            <div class="card shadow-sm">

                <img src="img/productos/laptop${i}.jpg"

                class="card-img-top">

                <div class="card-body">

                    <h6>Producto ${i}</h6>

                    <p>$${(1500000*i).toLocaleString()}</p>

                    <a href="producto.html"

                    class="btn btn-primary btn-sm">

                    Ver producto

                    </a>

                </div>

            </div>

        </div>

        `;

    }

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

    },2500);

}

/*=========================================================
                    FAVORITOS
=========================================================*/

const btnFavorito=document.getElementById("btnFavorito");

if(btnFavorito){

    btnFavorito.addEventListener("click",()=>{

        let favoritos=JSON.parse(

            localStorage.getItem("favoritos")

        ) || [];

        if(!favoritos.find(f=>f.id===producto.id)){

            favoritos.push(producto);

            localStorage.setItem(

                "favoritos",

                JSON.stringify(favoritos)

            );

            mensaje(

                "Producto agregado a favoritos.",

                "info"

            );

        }else{

            mensaje(

                "Este producto ya está en favoritos.",

                "warning"

            );

        }

    });

}

/*=========================================================
                    COMPARTIR
=========================================================*/

const btnCompartir=document.getElementById("btnCompartir");

if(btnCompartir){

    btnCompartir.addEventListener("click",()=>{

        navigator.clipboard.writeText(location.href);

        mensaje(

            "Enlace copiado al portapapeles.",

            "success"

        );

    });

}

/*=========================================================
                    INICIALIZACIÓN
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    actualizarContador();

    cargarRelacionados();

});
