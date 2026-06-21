/*=========================================================
                    VENTECH
                    configuracion.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

const formConfiguracion = document.getElementById("formConfiguracion");
const btnRestablecer = document.getElementById("btnRestablecer");
const btnBackup = document.getElementById("btnBackup");
const btnRestaurar = document.getElementById("btnRestaurar");
const inputArchivo = document.getElementById("archivoBackup");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    cargarConfiguracion();

    guardarConfiguracion();

    cambiarTema();

    exportarBackup();

    importarBackup();

    restablecerSistema();

});

/*=========================================================
                    CARGAR CONFIGURACIÓN
=========================================================*/

function cargarConfiguracion(){

    const configuracion = JSON.parse(

        localStorage.getItem("configuracion")

    );

    if(!configuracion) return;

    Object.keys(configuracion).forEach(id=>{

        const elemento = document.getElementById(id);

        if(!elemento) return;

        if(elemento.type==="checkbox"){

            elemento.checked = configuracion[id];

        }else{

            elemento.value = configuracion[id];

        }

    });

}

/*=========================================================
                    GUARDAR CONFIGURACIÓN
=========================================================*/

function guardarConfiguracion(){

    if(!formConfiguracion) return;

    formConfiguracion.addEventListener("submit",(e)=>{

        e.preventDefault();

        const datos={};

        formConfiguracion

        .querySelectorAll("input,select,textarea")

        .forEach(campo=>{

            if(campo.type==="checkbox"){

                datos[campo.id]=campo.checked;

            }else{

                datos[campo.id]=campo.value;

            }

        });

        localStorage.setItem(

            "configuracion",

            JSON.stringify(datos)

        );

        mostrarMensaje(

            "Configuración guardada correctamente.",

            "success"

        );

    });

}

/*=========================================================
                    TEMA OSCURO
=========================================================*/

function cambiarTema(){

    const tema=document.getElementById("tema");

    if(!tema) return;

    tema.addEventListener("change",()=>{

        if(tema.value==="oscuro"){

            document.body.classList.add("dark-mode");

        }else{

            document.body.classList.remove("dark-mode");

        }

        localStorage.setItem("tema",tema.value);

    });

    const temaGuardado=localStorage.getItem("tema");

    if(temaGuardado==="oscuro"){

        document.body.classList.add("dark-mode");

        tema.value="oscuro";

    }

}

/*=========================================================
                    BACKUP
=========================================================*/

function exportarBackup(){

    if(!btnBackup) return;

    btnBackup.addEventListener("click",()=>{

        const datos={

            configuracion:JSON.parse(localStorage.getItem("configuracion")),

            inventario:JSON.parse(localStorage.getItem("inventario")),

            ventas:JSON.parse(localStorage.getItem("ventas")),

            usuarios:JSON.parse(localStorage.getItem("usuarios"))

        };

        const archivo=new Blob(

            [JSON.stringify(datos,null,2)],

            {type:"application/json"}

        );

        const enlace=document.createElement("a");

        enlace.href=URL.createObjectURL(archivo);

        enlace.download="backup_ventech.json";

        enlace.click();

    });

}

/*=========================================================
                    RESTAURAR BACKUP
=========================================================*/

function importarBackup(){

    if(!btnRestaurar || !inputArchivo) return;

    btnRestaurar.addEventListener("click",()=>{

        inputArchivo.click();

    });

    inputArchivo.addEventListener("change",(e)=>{

        const archivo=e.target.files[0];

        if(!archivo) return;

        const lector=new FileReader();

        lector.onload=function(){

            try{

                const datos=JSON.parse(lector.result);

                Object.keys(datos).forEach(clave=>{

                    localStorage.setItem(

                        clave,

                        JSON.stringify(datos[clave])

                    );

                });

                mostrarMensaje(

                    "Backup restaurado correctamente.",

                    "success"

                );

            }catch{

                mostrarMensaje(

                    "Archivo inválido.",

                    "danger"

                );

            }

        };

        lector.readAsText(archivo);

    });

}

/*=========================================================
                    RESTABLECER
=========================================================*/

function restablecerSistema(){

    if(!btnRestablecer) return;

    btnRestablecer.addEventListener("click",()=>{

        if(!confirm(

            "¿Desea restablecer toda la configuración?"

        )) return;

        localStorage.removeItem("configuracion");

        location.reload();

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
                    INFORMACIÓN DEL SISTEMA
=========================================================*/

function cargarInformacionSistema(){

    const version=document.getElementById("versionSistema");

    const almacenamiento=document.getElementById("almacenamiento");

    if(version){

        version.textContent="VenTech v1.0";

    }

    if(almacenamiento){

        almacenamiento.textContent=

            (JSON.stringify(localStorage).length/1024)

            .toFixed(2)+" KB";

    }

}

cargarInformacionSistema();

/*=========================================================
                    LIMPIAR CACHÉ
=========================================================*/

const btnCache=document.getElementById("btnLimpiarCache");

if(btnCache){

    btnCache.addEventListener("click",()=>{

        sessionStorage.clear();

        mostrarMensaje(

            "Caché limpiada correctamente.",

            "info"

        );

    });

}

/*=========================================================
                    CERRAR SESIÓN
=========================================================*/

const btnCerrar=document.getElementById("btnCerrarSesion");

if(btnCerrar){

    btnCerrar.addEventListener("click",()=>{

        localStorage.removeItem("usuario");

        window.location.href="login.html";

    });

}
