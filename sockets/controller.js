
//Unicamente para fines de Desarollo se utiliza el new Socket() en js
//para que importe la libreria y tengas las ayudas ctrl+espacio
const e = require('cors');
const { Socket } = require('socket.io');
const { comprobarJWT } = require('../helpers');
const { ChatMensajes } = require('../models');

const chatMensajes = new ChatMensajes();

const socketController = async( socket = new Socket(), io ) => {

    const usuario = await comprobarJWT(socket.handshake.headers['x-token']);
    if( !usuario ){
        return socket.disconnect();
    }

    // Agregar el usuario conectado
    chatMensajes.conectarUsuario( usuario );
    io.emit('usuarios-activos', chatMensajes.usuariosArr );
    socket.emit('recibir-mensajes', chatMensajes.ultimos10 );
    

    //Mensajes privados conectar a sala especial  - Salas = [global,socket.id, usuario.id];
    socket.join(usuario.id);
    

    //Limpiar cuando alguien se desconecta
    socket.on('disconnect', () => {
        chatMensajes.desconectarUsuario( usuario.id );
        io.emit('usuarios-activos', chatMensajes.usuariosArr );
    });        

    socket.on('enviar-mensaje', ({ uid, mensaje }) => {
        console.log(uid);
        if( uid ){
            //Direct message
            socket.to(uid).emit('mensaje-privado', { de: usuario.nombre, mensaje});         
        }else{
            chatMensajes.enviarMensaje(usuario.id, usuario.nombre, mensaje );
            io.emit('recibir-mensajes', chatMensajes.ultimos10 );
        }        
    });
}


module.exports = {
    socketController
}