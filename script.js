const dataCasamento = new Date("May 9, 2026 00:00:00").getTime();

setInterval(function() {
    const agora = new Date().getTime();
    const diff = dataCasamento - agora;

    document.getElementById("dias").innerHTML = Math.floor(diff / (1000*60*60*24));
    document.getElementById("horas").innerHTML = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
    document.getElementById("minutos").innerHTML = Math.floor((diff%(1000*60*60))/(1000*60));
    document.getElementById("segundos").innerHTML = Math.floor((diff%(1000*60))/1000);
}, 1000);
