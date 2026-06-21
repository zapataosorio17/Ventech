/*=========================================================
                    VENTECH
                    registro.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

const formRegistro = document.getElementById("formRegistro");
const password = document.getElementById("password");
const confirmarPassword = document.getElementById("confirmarPassword");
const btnMostrarPassword = document.getElementById("btnMostrarPassword");
const btnMostrarConfirmar = document.getElementById("btnMostrarConfirmar");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    mostrarOcultarPassword();

    registrarUsuario();

});

/*=========================================================
                    MOSTRAR / OCULTAR CONTRASEÑA
=========================================================*/

function mostrarOcultarPassword(){

    if(btnMostrarPassword){

        btnMostrarPassword.addEventListener("click",()=>{

            password.type=

                password.type==="password"

                ? "text"

                : "password";

        });

    }

    if(btnMostrarConfirmar){

        btnMostrarConfirmar.addEventListener("click",()=>{

            confirmarPassword.type=

                confirmarPassword.type==="password"

                ? "text"

                : "password";

        });

    }

}

/*=========================================================
                    VALIDAR FORMULARIO
=========================================================*/

function validarFormulario(){

    let valido=true;

    const campos=formRegistro.querySelectorAll("[required]");

    campos.forEach(campo=>{

        if(campo.value.trim()===""){

            campo.classList.add("is-invalid");

            valido=false;

        }else{

            campo.classList.remove("is-invalid");

            campo.classList.add("is-valid");

        }

    });

    if(password.value!==confirmarPassword.value){

        confirmarPassword.classList.add("is-invalid");

        mensaje(

            "Las contraseñas no coinciden.",

            "danger"

        );

        valido=false;

    }

    if(password.value.length<6){

        password.classList.add("is-invalid");

        mensaje(

            "La contraseña debe tener mínimo 6 caracteres.",

            "warning"

        );

        valido=false;

    }

    return valido;

}

/*=========================================================
                    REGISTRAR USUARIO
=========================================================*/

function registrarUsuario(){

    if(!formRegistro) return;

    formRegistro.addEventListener("submit",(e)=>{

        e.preventDefault();

        if(!validarFormulario()) return;

        let usuarios=

            JSON.parse(localStorage.getItem("usuarios"))

            || [];

        const usuario={

            id:Date.now(),

            nombre:document.getElementById("nombre").value,

            apellido:document.getElementById("apellido").value,

            correo:document.getElementById("correo").value,

            telefono:document.getElementById("telefono").value,

            direccion:document.getElementById("direccion").value,

            password:password.value,

            fecha:new Date().toLocaleDateString("es-CO")

        };

        const existe=usuarios.find(

            u=>u.correo===usuario.correo

        );

        if(existe){

            mensaje(

                "El correo ya está registrado.",

                "danger"

            );

            return;

        }

        usuarios.push(usuario);

        localStorage.setItem(

            "usuarios",

            JSON.stringify(usuarios)

        );

        localStorage.setItem(

            "usuario",

            JSON.stringify(usuario)

        );

        mensaje(

            "Registro exitoso.",

            "success"

        );

        formRegistro.reset();

        setTimeout(()=>{

            window.location.href="login.html";

        },2000);

    });

}

/*=========================================================
                    FORTALEZA CONTRASEÑA
=========================================================*/

password?.addEventListener("keyup",()=>{

    const barra=document.getElementById("barraPassword");

    if(!barra) return;

    const longitud=password.value.length;

    barra.style.width=(longitud*10)+"%";

    if(longitud<6){

        barra.className="progress-bar bg-danger";

    }else if(longitud<10){

        barra.className="progress-bar bg-warning";

    }else{

        barra.className="progress-bar bg-success";

    }

});

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
                    LIMPIAR FORMULARIO
=========================================================*/

function limpiarFormulario(){

    formRegistro.reset();

    formRegistro.querySelectorAll(".is-valid,.is-invalid")

    .forEach(campo=>{

        campo.classList.remove("is-valid");

        campo.classList.remove("is-invalid");

    });

}

