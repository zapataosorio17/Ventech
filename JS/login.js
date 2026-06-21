/*=========================================================
                    VENTECH
                    login.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

const loginForm = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const btnMostrar = document.getElementById("btnMostrarPassword");

/*=========================================================
                    INICIALIZACIÓN
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    mostrarOcultarPassword();

    recordarUsuario();

    iniciarSesion();

});

/*=========================================================
                    MOSTRAR CONTRASEÑA
=========================================================*/

function mostrarOcultarPassword(){

    if(!btnMostrar || !password) return;

    btnMostrar.addEventListener("click",()=>{

        if(password.type==="password"){

            password.type="text";

            btnMostrar.innerHTML='<i class="bi bi-eye-slash"></i>';

        }else{

            password.type="password";

            btnMostrar.innerHTML='<i class="bi bi-eye"></i>';

        }

    });

}

/*=========================================================
                    VALIDAR FORMULARIO
=========================================================*/

function validarFormulario(){

    let valido=true;

    if(email.value.trim()===""){

        email.classList.add("is-invalid");

        valido=false;

    }else{

        email.classList.remove("is-invalid");

        email.classList.add("is-valid");

    }

    if(password.value.trim()===""){

        password.classList.add("is-invalid");

        valido=false;

    }else{

        password.classList.remove("is-invalid");

        password.classList.add("is-valid");

    }

    return valido;

}

/*=========================================================
                    RECORDAR USUARIO
=========================================================*/

function recordarUsuario(){

    const correoGuardado=localStorage.getItem("correo");

    if(correoGuardado && email){

        email.value=correoGuardado;

    }

}

/*=========================================================
                    LOGIN
=========================================================*/

function iniciarSesion(){

    if(!loginForm) return;

    loginForm.addEventListener("submit",(e)=>{

        e.preventDefault();

        if(!validarFormulario()){

            mostrarMensaje("Complete todos los campos.","danger");

            return;

        }

        const usuario=email.value.trim();

        const clave=password.value.trim();

        // Usuario de prueba
        if(usuario==="admin@ventech.com" && clave==="123456"){

            localStorage.setItem("correo",usuario);

            mostrarMensaje("Bienvenido a VenTech.","success");

            setTimeout(()=>{

                window.location.href="dashboard.html";

            },1200);

        }else{

            mostrarMensaje("Correo o contraseña incorrectos.","danger");

        }

    });

}

/*=========================================================
                    MENSAJES
=========================================================*/

function mostrarMensaje(texto,tipo){

    const alerta=document.getElementById("mensaje");

    if(!alerta){

        alert(texto);

        return;

    }

    alerta.innerHTML=`

        <div class="alert alert-${tipo}">

            ${texto}

        </div>

    `;

}

/*=========================================================
                    ENTER
=========================================================*/

document.addEventListener("keypress",(e)=>{

    if(e.key==="Enter"){

        if(loginForm){

            loginForm.requestSubmit();

        }

    }

});

/*=========================================================
                    LIMPIAR FORMULARIO
=========================================================*/

function limpiarFormulario(){

    if(loginForm){

        loginForm.reset();

    }

}

/*=========================================================
                    CERRAR SESIÓN
=========================================================*/

function cerrarSesion(){

    localStorage.removeItem("correo");

    window.location.href="login.html";

}

