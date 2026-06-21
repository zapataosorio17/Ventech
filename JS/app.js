/*=========================================================
                VENTECH
                app.js
=========================================================*/

"use strict";

/*=========================================================
                VARIABLES GLOBALES
=========================================================*/

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const body = document.body;
const navbar = $(".navbar");
const btnTop = $("#btnTop");

/*=========================================================
                INICIALIZACIÓN
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initNavbar();

    initScrollTop();

    initSmoothScroll();

    initAnimations();

    console.log("VenTech iniciado correctamente.");

});

/*=========================================================
                NAVBAR
=========================================================*/

function initNavbar(){

    if(!navbar) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY > 60){

            navbar.classList.add("shadow");

        }else{

            navbar.classList.remove("shadow");

        }

    });

}

/*=========================================================
                MENÚ RESPONSIVE
=========================================================*/

const menuBtn = $(".navbar-toggler");

const menuCollapse = $(".navbar-collapse");

if(menuBtn){

    menuBtn.addEventListener("click",()=>{

        menuCollapse.classList.toggle("show");

    });

}

/*=========================================================
                BOTÓN VOLVER ARRIBA
=========================================================*/

function initScrollTop(){

    if(!btnTop) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY > 300){

            btnTop.classList.add("show");

        }else{

            btnTop.classList.remove("show");

        }

    });

    btnTop.addEventListener("click",()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

}

/*=========================================================
                SCROLL SUAVE
=========================================================*/

function initSmoothScroll(){

    $$("a[href^='#']").forEach(link=>{

        link.addEventListener("click",function(e){

            const destino = document.querySelector(this.getAttribute("href"));

            if(destino){

                e.preventDefault();

                destino.scrollIntoView({

                    behavior:"smooth"

                });

            }

        });

    });

}

/*=========================================================
                ANIMACIONES
=========================================================*/

function initAnimations(){

    const elementos = document.querySelectorAll(

        ".fade-up,.fade-in,.zoom-in,.slide-left,.slide-right"

    );

    if(elementos.length===0) return;

    const observer = new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.classList.add("animate");

            }

        });

    },{

        threshold:.2

    });

    elementos.forEach(el=>observer.observe(el));

}

/*=========================================================
                UTILIDADES
=========================================================*/

function formatoPrecio(valor){

    return new Intl.NumberFormat("es-CO",{

        style:"currency",

        currency:"COP"

    }).format(valor);

}

function generarID(){

    return Math.random().toString(36).substring(2,10);

}

function fechaActual(){

    const fecha = new Date();

    return fecha.toLocaleDateString("es-CO");

}

function horaActual(){

    const hora = new Date();

    return hora.toLocaleTimeString("es-CO");

}

/*=========================================================
                STORAGE
=========================================================*/

const Storage={

    guardar(clave,valor){

        localStorage.setItem(clave,JSON.stringify(valor));

    },

    obtener(clave){

        return JSON.parse(localStorage.getItem(clave));

    },

    eliminar(clave){

        localStorage.removeItem(clave);

    },

    limpiar(){

        localStorage.clear();

    }

};

/*=========================================================
                FIN PARTE 1
=========================================================*/
/*=========================================================
                CARRITO
=========================================================*/

let carrito = Storage.obtener("carrito") || [];

function guardarCarrito(){

    Storage.guardar("carrito", carrito);

}

function agregarAlCarrito(id,nombre,precio,cantidad=1){

    const existe = carrito.find(p=>p.id===id);

    if(existe){

        existe.cantidad += cantidad;

    }else{

        carrito.push({

            id,
            nombre,
            precio,
            cantidad

        });

    }

    guardarCarrito();

    actualizarCarrito();

    mostrarToast("Producto agregado al carrito");

}

function eliminarDelCarrito(id){

    carrito = carrito.filter(producto=>producto.id!==id);

    guardarCarrito();

    actualizarCarrito();

}

function actualizarCantidad(id,cantidad){

    const producto = carrito.find(p=>p.id===id);

    if(producto){

        producto.cantidad = cantidad;

    }

    guardarCarrito();

    actualizarCarrito();

}

function totalCarrito(){

    return carrito.reduce((total,producto)=>{

        return total + (producto.precio * producto.cantidad);

    },0);

}

function actualizarCarrito(){

    const contador = document.getElementById("cartCount");

    if(contador){

        contador.textContent = carrito.length;

    }

    const total = document.getElementById("cartTotal");

    if(total){

        total.textContent = formatoPrecio(totalCarrito());

    }

}

/*=========================================================
                PRODUCTOS
=========================================================*/

function cargarProductos(){

    document.querySelectorAll(".btn-agregar").forEach(btn=>{

        btn.addEventListener("click",()=>{

            agregarAlCarrito(

                btn.dataset.id,

                btn.dataset.nombre,

                Number(btn.dataset.precio),

                1

            );

        });

    });

}

/*=========================================================
                FILTROS
=========================================================*/

function filtrarProductos(){

    const buscador=document.getElementById("buscarProducto");

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const texto=buscador.value.toLowerCase();

        document.querySelectorAll(".product-card").forEach(card=>{

            const nombre=card.innerText.toLowerCase();

            card.style.display =

                nombre.includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                CHECKOUT
=========================================================*/

function realizarCompra(){

    const boton=document.getElementById("btnComprar");

    if(!boton) return;

    boton.addEventListener("click",()=>{

        if(carrito.length===0){

            mostrarToast("El carrito está vacío.");

            return;

        }

        mostrarToast("Compra realizada correctamente.");

        carrito=[];

        guardarCarrito();

        actualizarCarrito();

    });

}

/*=========================================================
                CUPONES
=========================================================*/

function aplicarCupon(){

    const boton=document.getElementById("btnCupon");

    if(!boton) return;

    boton.addEventListener("click",()=>{

        const codigo=document.getElementById("codigoCupon").value;

        if(codigo==="VENTECH10"){

            mostrarToast("Cupón aplicado.");

        }else{

            mostrarToast("Cupón inválido.");

        }

    });

}

/*=========================================================
                HISTORIAL
=========================================================*/

function cargarHistorial(){

    const historial = Storage.obtener("historial") || [];

    console.log(historial);

}

/*=========================================================
                FACTURAS
=========================================================*/

function descargarFactura(){

    const botones=document.querySelectorAll(".btn-factura");

    botones.forEach(btn=>{

        btn.addEventListener("click",()=>{

            mostrarToast("Descargando factura...");

        });

    });

}

/*=========================================================
                INICIALIZACIÓN TIENDA
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    actualizarCarrito();

    cargarProductos();

    filtrarProductos();

    realizarCompra();

    aplicarCupon();

    cargarHistorial();

    descargarFactura();

});

/*=========================================================
                FIN PARTE 2
=========================================================*/

/*=========================================================
                DASHBOARD
=========================================================*/

function initDashboard(){

    actualizarFecha();

    cargarIndicadores();

    inicializarGraficas();

}

function actualizarFecha(){

    const fecha = document.getElementById("fechaActual");

    if(fecha){

        fecha.textContent = new Date().toLocaleDateString("es-CO");

    }

}

function cargarIndicadores(){

    const indicadores=document.querySelectorAll(".kpi-value");

    indicadores.forEach(indicador=>{

        indicador.classList.add("animate");

    });

}

/*=========================================================
                CHART.JS
=========================================================*/

function inicializarGraficas(){

    if(typeof Chart==="undefined") return;

    const ventas=document.getElementById("graficaVentas");

    if(ventas){

        new Chart(ventas,{

            type:"line",

            data:{

                labels:["Ene","Feb","Mar","Abr","May","Jun"],

                datasets:[{

                    label:"Ventas",

                    data:[15,28,35,40,58,70],

                    borderColor:"#0d6efd",

                    backgroundColor:"rgba(13,110,253,.2)",

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

}

/*=========================================================
                INVENTARIO
=========================================================*/

function actualizarStock(){

    document.querySelectorAll(".stock-value").forEach(stock=>{

        const cantidad=parseInt(stock.textContent);

        if(cantidad<=5){

            stock.classList.add("text-danger");

        }else if(cantidad<=15){

            stock.classList.add("text-warning");

        }else{

            stock.classList.add("text-success");

        }

    });

}

/*=========================================================
                USUARIOS
=========================================================*/

function buscarUsuarios(){

    const input=document.getElementById("buscarUsuario");

    if(!input) return;

    input.addEventListener("keyup",()=>{

        const texto=input.value.toLowerCase();

        document.querySelectorAll(".usuario-row").forEach(fila=>{

            fila.style.display=fila.innerText.toLowerCase().includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                PRODUCTOS
=========================================================*/

function buscarProductos(){

    const buscador=document.getElementById("buscarProducto");

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const valor=buscador.value.toLowerCase();

        document.querySelectorAll(".product-card").forEach(card=>{

            const titulo=card.innerText.toLowerCase();

            card.style.display=titulo.includes(valor)

                ? "block"

                : "none";

        });

    });

}

/*=========================================================
                REPORTES
=========================================================*/

function exportarReporte(tipo){

    console.log("Exportando reporte:",tipo);

    mostrarToast("Reporte generado correctamente.");

}

/*=========================================================
                CONFIGURACIÓN
=========================================================*/

function guardarConfiguracion(){

    const formulario=document.getElementById("configForm");

    if(!formulario) return;

    formulario.addEventListener("submit",(e)=>{

        e.preventDefault();

        mostrarToast("Configuración guardada.");

    });

}

/*=========================================================
                MODALES
=========================================================*/

function abrirModal(id){

    const modal=document.getElementById(id);

    if(!modal) return;

    const instancia=new bootstrap.Modal(modal);

    instancia.show();

}

function cerrarModal(id){

    const modal=document.getElementById(id);

    if(!modal) return;

    const instancia=bootstrap.Modal.getInstance(modal);

    if(instancia){

        instancia.hide();

    }

}

/*=========================================================
                ALERTAS
=========================================================*/

function mostrarAlerta(texto,tipo="success"){

    const alerta=document.createElement("div");

    alerta.className=`alert alert-${tipo}`;

    alerta.textContent=texto;

    document.body.appendChild(alerta);

    setTimeout(()=>{

        alerta.remove();

    },3000);

}

/*=========================================================
                INICIALIZACIÓN PANEL
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initDashboard();

    actualizarStock();

    buscarUsuarios();

    buscarProductos();

    guardarConfiguracion();

});

/*=========================================================
                FIN PARTE 3
=========================================================*/

/*=========================================================
                VALIDACIÓN DE FORMULARIOS
=========================================================*/

function validarFormulario(formulario){

    if(!formulario) return false;

    const campos = formulario.querySelectorAll("[required]");

    let valido = true;

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
                LOGIN
=========================================================*/

function iniciarSesion(){

    const form=document.getElementById("loginForm");

    if(!form) return;

    form.addEventListener("submit",(e)=>{

        e.preventDefault();

        if(validarFormulario(form)){

            mostrarToast("Bienvenido a VenTech");

            setTimeout(()=>{

                window.location.href="dashboard.html";

            },1000);

        }

    });

}

/*=========================================================
                REGISTRO
=========================================================*/

function registrarUsuario(){

    const form=document.getElementById("registroForm");

    if(!form) return;

    form.addEventListener("submit",(e)=>{

        e.preventDefault();

        if(validarFormulario(form)){

            mostrarToast("Usuario registrado correctamente.");

            form.reset();

        }

    });

}

/*=========================================================
                TEMA OSCURO
=========================================================*/

function cambiarTema(){

    const boton=document.getElementById("btnTema");

    if(!boton) return;

    boton.addEventListener("click",()=>{

        document.body.classList.toggle("dark-mode");

        const oscuro=document.body.classList.contains("dark-mode");

        Storage.guardar("tema",oscuro?"dark":"light");

    });

}

function cargarTema(){

    const tema=Storage.obtener("tema");

    if(tema==="dark"){

        document.body.classList.add("dark-mode");

    }

}

/*=========================================================
                TOAST
=========================================================*/

function mostrarToast(mensaje){

    const toast=document.createElement("div");

    toast.className="toast-custom";

    toast.innerHTML=`

        <i class="bi bi-check-circle-fill"></i>

        <span>${mensaje}</span>

    `;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.classList.add("show");

    },100);

    setTimeout(()=>{

        toast.classList.remove("show");

        setTimeout(()=>{

            toast.remove();

        },300);

    },3000);

}

/*=========================================================
                CONFIRMACIÓN
=========================================================*/

function confirmar(mensaje){

    return confirm(mensaje);

}

/*=========================================================
                CARGA
=========================================================*/

window.addEventListener("load",()=>{

    const loader=document.getElementById("loader");

    if(loader){

        loader.style.display="none";

    }

});

/*=========================================================
                RELOJ
=========================================================*/

function iniciarReloj(){

    const reloj=document.getElementById("reloj");

    if(!reloj) return;

    setInterval(()=>{

        reloj.textContent=new Date().toLocaleTimeString("es-CO");

    },1000);

}

/*=========================================================
                UTILIDADES
=========================================================*/

function numeroAleatorio(min,max){

    return Math.floor(Math.random()*(max-min+1))+min;

}

function capitalizar(texto){

    return texto.charAt(0).toUpperCase()+texto.slice(1);

}

function debounce(funcion,espera){

    let timer;

    return function(){

        clearTimeout(timer);

        timer=setTimeout(()=>{

            funcion.apply(this,arguments);

        },espera);

    };

}

/*=========================================================
                INICIALIZACIÓN GENERAL
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    iniciarSesion();

    registrarUsuario();

    cargarTema();

    cambiarTema();

    iniciarReloj();

});

