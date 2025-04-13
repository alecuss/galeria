document.addEventListener('DOMContentLoaded', () => {
    const photoInput = document.getElementById('photoInput');
    const dropZone = document.getElementById('dropZone');
    const gallery = document.getElementById('gallery');
    const cropModal = document.getElementById('cropModal');
    const imageToCrop = document.getElementById('imageToCrop');
    const cropBtn = document.getElementById('cropBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');

    let cropper;
    let currentPhotoId;

    // Cargar fotos guardadas al iniciar
    loadPhotos();

    // Subir fotos
    photoInput.addEventListener('change', handleFiles);
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(e) {
        const files = e.target ? e.target.files : e;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                showCropModal(reader.result);
            };
            reader.readAsDataURL(file);
        });
    }

    // Modal para recortar
    function showCropModal(src) {
        imageToCrop.src = src;
        cropModal.style.display = 'flex';
        cropper = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            responsive: true,
        });
    }

    cropBtn.addEventListener('click', () => {
        const croppedCanvas = cropper.getCroppedCanvas();
        const polaroidCanvas = createPolaroid(croppedCanvas);
        const dataURL = polaroidCanvas.toDataURL('image/jpeg');
        const photoId = currentPhotoId || Date.now();
        savePhoto(photoId, dataURL);
        if (!currentPhotoId) {
            addPhotoToGallery(dataURL, photoId, 0);
        } else {
            updatePhotoInGallery(photoId, dataURL);
        }
        closeCropModal();
    });

    cancelCropBtn.addEventListener('click', closeCropModal);

    function closeCropModal() {
        cropModal.style.display = 'none';
        if (cropper) cropper.destroy();
        imageToCrop.src = '';
        currentPhotoId = null;
    }

    // Crear efecto Polaroid
    function createPolaroid(canvas) {
        const polaroidCanvas = document.createElement('canvas');
        const ctx = polaroidCanvas.getContext('2d');
        polaroidCanvas.width = canvas.width + 40;
        polaroidCanvas.height = canvas.height + 80;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, polaroidCanvas.width, polaroidCanvas.height);
        ctx.drawImage(canvas, 20, 20, canvas.width, canvas.height);
        return polaroidCanvas;
    }

    // Guardar y cargar fotos
    function savePhoto(id, dataURL) {
        try {
            let photos = JSON.parse(localStorage.getItem('photos') || '[]');
            const existingPhotoIndex = photos.findIndex(photo => photo.id === id);
            if (existingPhotoIndex >= 0) {
                photos[existingPhotoIndex].src = dataURL;
            } else {
                photos.push({ id, src: dataURL, likes: 0 });
            }
            localStorage.setItem('photos', JSON.stringify(photos));
        } catch (e) {
            console.error('Error saving photo:', e);
        }
    }

    function loadPhotos() {
        try {
            const photos = JSON.parse(localStorage.getItem('photos') || '[]');
            gallery.innerHTML = ''; // Limpiar galería antes de cargar
            photos.forEach(photo => {
                if (photo.src && photo.id) {
                    addPhotoToGallery(photo.src, photo.id, photo.likes || 0);
                }
            });
        } catch (e) {
            console.error('Error loading photos:', e);
            localStorage.setItem('photos', '[]'); // Reiniciar si hay error
        }
    }

    // Añadir foto a la galería
    function addPhotoToGallery(src, id, likes) {
        const polaroid = document.createElement('div');
        polaroid.className = 'polaroid';
        polaroid.dataset.id = id;

        polaroid.innerHTML = `
            <img src="${src}" alt="Foto">
            <div class="polaroid-buttons">
                <button class="polaroid-btn edit-btn">✂️</button>
                <button class="polaroid-btn delete-btn">🗑️</button>
                <button class="polaroid-btn like-btn ${likes > 0 ? 'liked' : ''}" data-likes="${likes}">
                    ❤️ <span>${likes}</span>
                </button>
            </div>
        `;

        gallery.appendChild(polaroid);

        // Event listeners para botones
        polaroid.querySelector('.edit-btn').addEventListener('click', () => {
            currentPhotoId = id;
            showCropModal(src);
        });

        polaroid.querySelector('.delete-btn').addEventListener('click', () => {
            deletePhoto(id);
            polaroid.remove();
        });

        polaroid.querySelector('.like-btn').addEventListener('click', (e) => {
            const btn = e.target.closest('.like-btn');
            let currentLikes = parseInt(btn.dataset.likes);
            currentLikes = btn.classList.contains('liked') ? currentLikes - 1 : currentLikes + 1;
            btn.dataset.likes = currentLikes;
            btn.querySelector('span').textContent = currentLikes;
            btn.classList.toggle('liked');
            updateLikes(id, currentLikes);
        });
    }

    // Actualizar foto en la galería (para edición)
    function updatePhotoInGallery(id, src) {
        const polaroid = gallery.querySelector(`.polaroid[data-id="${id}"]`);
        if (polaroid) {
            polaroid.querySelector('img').src = src;
        }
    }

    function deletePhoto(id) {
        try {
            let photos = JSON.parse(localStorage.getItem('photos') || '[]');
            photos = photos.filter(photo => photo.id !== id);
            localStorage.setItem('photos', JSON.stringify(photos));
        } catch (e) {
            console.error('Error deleting photo:', e);
        }
    }

    function updateLikes(id, likes) {
        try {
            let photos = JSON.parse(localStorage.getItem('photos') || '[]');
            const photo = photos.find(p => p.id === id);
            if (photo) {
                photo.likes = likes;
                localStorage.setItem('photos', JSON.stringify(photos));
            }
        } catch (e) {
            console.error('Error updating likes:', e);
        }
    }
});
