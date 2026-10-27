const {
    contextBridge,
    ipcRenderer
} = require('electron');


contextBridge.exposeInMainWorld('api', {

    // Чтение каталога
    listDir: (dir) =>
        ipcRenderer.invoke(
            'list-dir',
            dir
        ),


    // Запуск наблюдения
    startWatch: (dir) =>
        ipcRenderer.invoke(
            'start-watch',
            dir
        ),


    // Остановка наблюдения
    stopWatch: () =>
        ipcRenderer.invoke(
            'stop-watch'
        ),


    // Событие появления нового файла
    onFileAdded: (callback) => {

        const listener = (event, name) => {
            callback(name);
        };

        ipcRenderer.on(
            'file-added',
            listener
        );

        return () => {
            ipcRenderer.removeListener(
                'file-added',
                listener
            );
        };
    },


    // Событие ошибки наблюдения
    onWatchError: (callback) => {

        const listener =
            (event, message) => {
                callback(message);
            };

        ipcRenderer.on(
            'watch-error',
            listener
        );

        return () => {
            ipcRenderer.removeListener(
                'watch-error',
                listener
            );
        };
    }
});