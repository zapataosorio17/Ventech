/*=========================================================
                    VENTECH
                    usuarios.js
=========================================================*/

"use strict";

/*=========================================================
                    VARIABLES
=========================================================*/

let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

const tabla = document.getElementById("tablaUsuarios");
const formulario = document.getElementById("formUsuario");
const buscador = document.getElementById("buscarUsuario");
const filtroRol = document.getElementById("filtroRol");

/*=========================================================
                    INICIO
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    listarUsuarios();

    registrarUsuario();

    buscarUsuarios();

    filtrarRol();

    cargarResumen();

});

/*=========================================================
                    LISTAR USUARIOS
=========================================================*/

function listarUsuarios(){

    if(!tabla) return;

    tabla.innerHTML="";

    if(usuarios.length===0){

        tabla.innerHTML=`

        <tr>

            <td colspan="8" class="text-center">

                No existen usuarios registrados.

            </td>

        </tr>

        `;

        return;

    }

    usuarios.forEach((usuario,index)=>{

        tabla.innerHTML+=`

        <tr>

            <td>${usuario.id}</td>

            <td>${usuario.nombre}</td>

            <td>${usuario.apellido || ""}</td>

            <td>${usuario.correo}</td>

            <td>${usuario.telefono || "-"}</td>

            <td>

                <span class="badge bg-primary">

                    ${usuario.rol || "Cliente"}

                </span>

            </td>

            <td>${usuario.fecha || "-"}</td>

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

        btn.addEventListener("click",editarUsuario);

    });

    document.querySelectorAll(".eliminar").forEach(btn=>{

        btn.addEventListener("click",eliminarUsuario);

    });

}

/*=========================================================
                    REGISTRAR
=========================================================*/

function registrarUsuario(){

    if(!formulario) return;

    formulario.addEventListener("submit",(e)=>{

        e.preventDefault();

        const usuario={

            id:Date.now(),

            nombre:document.getElementById("nombre").value,

            apellido:document.getElementById("apellido").value,

            correo:document.getElementById("correo").value,

            telefono:document.getElementById("telefono").value,

            rol:document.getElementById("rol").value,

            fecha:new Date().toLocaleDateString("es-CO")

        };

        usuarios.push(usuario);

        guardarUsuarios();

        formulario.reset();

        listarUsuarios();

        cargarResumen();

        mostrarMensaje("Usuario registrado correctamente.","success");

    });

}

/*=========================================================
                    EDITAR
=========================================================*/

function editarUsuario(e){

    const index=e.target.dataset.index;

    const usuario=usuarios[index];

    document.getElementById("nombre").value=usuario.nombre;
    document.getElementById("apellido").value=usuario.apellido;
    document.getElementById("correo").value=usuario.correo;
    document.getElementById("telefono").value=usuario.telefono;
    document.getElementById("rol").value=usuario.rol;

    usuarios.splice(index,1);

    guardarUsuarios();

    listarUsuarios();

}

/*=========================================================
                    ELIMINAR
=========================================================*/

function eliminarUsuario(e){

    if(!confirm("¿Desea eliminar este usuario?")) return;

    const index=e.target.dataset.index;

    usuarios.splice(index,1);

    guardarUsuarios();

    listarUsuarios();

    cargarResumen();

    mostrarMensaje("Usuario eliminado.","danger");

}

/*=========================================================
                    BUSCAR
=========================================================*/

function buscarUsuarios(){

    if(!buscador) return;

    buscador.addEventListener("keyup",()=>{

        const texto=buscador.value.toLowerCase();

        document.querySelectorAll("#tablaUsuarios tr").forEach(fila=>{

            fila.style.display=

                fila.innerText.toLowerCase().includes(texto)

                ? ""

                : "none";

        });

    });

}

/*=========================================================
                    FILTRAR POR ROL
=========================================================*/

function filtrarRol(){

    if(!filtroRol) return;

    filtroRol.addEventListener("change",()=>{

        const rol=filtroRol.value;

        document.querySelectorAll("#tablaUsuarios tr").forEach(fila=>{

            if(rol===""){

                fila.style.display="";

            }else{

                fila.style.display=

                    fila.innerText.includes(rol)

                    ? ""

                    : "none";

            }

        });

    });

}

/*=========================================================
                    RESUMEN
=========================================================*/

function cargarResumen(){

    const total=document.getElementById("totalUsuarios");
    const administradores=document.getElementById("totalAdministradores");
    const clientes=document.getElementById("totalClientes");

    if(total){

        total.textContent=usuarios.length;

    }

    if(administradores){

        administradores.textContent=

            usuarios.filter(

                u=>u.rol==="Administrador"

            ).length;

    }

    if(clientes){

        clientes.textContent=

            usuarios.filter(

                u=>u.rol==="Cliente"

            ).length;

    }

}

/*=========================================================
                    GUARDAR
=========================================================*/

function guardarUsuarios(){

    localStorage.setItem(

        "usuarios",

        JSON.stringify(usuarios)

    );

}

/*=========================================================
                    EXPORTAR
=========================================================*/

const btnExportar=document.getElementById("btnExportar");

if(btnExportar){

    btnExportar.addEventListener("click",()=>{

        console.table(usuarios);

        mostrarMensaje(

            "Listado de usuarios exportado.",

            "info"

        );

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
                    ACTUALIZACIÓN AUTOMÁTICA
=========================================================*/

setInterval(()=>{

    usuarios=JSON.parse(

        localStorage.getItem("usuarios")

    ) || [];

    listarUsuarios();

    cargarResumen();

},10000);

