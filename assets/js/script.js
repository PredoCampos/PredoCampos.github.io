function typeWriterWrite(elemento, texto) {
    if (elemento.innerHTML.trim() !== '') {
        typeWriterDelete(elemento);
    }

    const textoArray = texto.split('');
    let i = 0;

    const timer = setInterval(function () {
        elemento.innerHTML += textoArray[i];
        i++;
        if (i === textoArray.length) {
            clearInterval(timer);
        }
    }, 100);
}

function typeWriterDelete(elemento) {
    if (elemento.innerHTML.trim() === '') {
        return;
    }

    const textoArray = elemento.innerHTML.split('');
    let i = textoArray.length - 1;

    const timer = setInterval(function () {
        textoArray.pop();
        elemento.innerHTML = textoArray.join('');
        i--;
        if (i < 0) {
            clearInterval(timer);
        }
    }, 100);
}

function loopTypeWriter(elemento, texto) {
    let i = 0;
    let delay = 0;

    function writeAndDelete() {
        typeWriterWrite(elemento, texto[i]);
        const textoArray = texto[i].split('');
        const writeDuration = textoArray.length * 100;

        setTimeout(function () {
            typeWriterDelete(elemento);

            const deleteDuration = textoArray.length * 50;
            const deleteDelay = deleteDuration + 2000;
            i++;
            delay += writeDuration + 2000;

            if (i === texto.length) {
                setTimeout(function () {
                    loopTypeWriter(elemento, texto);
                }, delay + 1500);
            } else {
                setTimeout(writeAndDelete, deleteDelay);
            }
        }, writeDuration + 2000);
    }

    writeAndDelete();
}