export class ImageLoader {
  constructor() {
    this.cache = new Map(); // id -> { status, img }
  }

  get(sticker) {
    let record = this.cache.get(sticker.id);
    
    if (record) {
      return record; // Já está carregada, carregando ou falhou
    }

    // Primeira vez que esta obra entra no viewport
    record = { status: 'loading', img: new Image() };
    this.cache.set(sticker.id, record);

    record.img.onload = () => {
      record.status = 'loaded';
      // Não precisamos forçar um re-render porque o app.js 
      // já está rodando a 60fps no requestAnimationFrame.
    };
    
    record.img.onerror = () => {
      record.status = 'error';
    };

    // Assumindo a estrutura do A.1: sticker.image contém "stickers/id.png"
    record.img.src = sticker.image;

    return record;
  }
}