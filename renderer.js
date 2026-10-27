const listButton =
    document.getElementById('listButton');

const startWatchButton =
    document.getElementById('startWatchButton');

const stopWatchButton =
    document.getElementById('stopWatchButton');

const fileList =
    document.getElementById('fileList');

const status =
    document.getElementById('status');

const events =
    document.getElementById('events');


// Вывод содержимого каталога
async function showDirectory() {

    try {

        const entries =
            await window.api.listDir('.');

        fileList.innerHTML = '';


        for (const entry of entries) {

            const item =
                document.createElement('li');

            if (entry.isDir) {

                item.textContent =
                    `📁 ${entry.name}`;

                item.classList.add(
                    'directory'
                );

            } else {

                item.textContent =
                    `📄 ${entry.name}`;
            }

            fileList.appendChild(item);
        }

    } catch (error) {

        console.error(error);

        status.textContent =
            'Ошибка чтения каталога';
    }
}


// Кнопка показа каталога
listButton.addEventListener(
    'click',
    showDirectory
);


// Запуск наблюдения
startWatchButton.addEventListener(
    'click',
    async () => {

        try {

            const result =
                await window.api.startWatch('.');

            status.textContent =
                `Наблюдение включено: ${result.dir}`;

        } catch (error) {

            console.error(error);

            status.textContent =
                'Ошибка запуска наблюдения';
        }
    }
);


// Остановка наблюдения
stopWatchButton.addEventListener(
    'click',
    async () => {

        try {

            await window.api.stopWatch();

            status.textContent =
                'Наблюдение выключено';

        } catch (error) {

            console.error(error);

            status.textContent =
                'Ошибка остановки наблюдения';
        }
    }
);


// Получение события о новом файле
window.api.onFileAdded(
    async (name) => {

        const item =
            document.createElement('li');

        item.textContent =
            `Новый файл: ${name}`;

        events.prepend(item);

        // Обновляем список файлов
        await showDirectory();
    }
);


// Получение сообщения об ошибке
window.api.onWatchError(
    (message) => {

        status.textContent =
            `Ошибка наблюдения: ${message}`;
    }
);


// Показываем каталог после запуска приложения
showDirectory();