const {
    app,
    BrowserWindow,
    ipcMain,
    Notification
} = require('electron');

const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');


let mainWindow;
let watcher = null;
let watchedDir = null;
let knownEntries = new Set();


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,

        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');
}


// Чтение содержимого каталога
ipcMain.handle('list-dir', async (event, dir) => {
    const targetDir = path.resolve(dir || '.');

    const entries = await fsp.readdir(
        targetDir,
        { withFileTypes: true }
    );

    return entries.map((entry) => ({
        name: entry.name,
        isDir: entry.isDirectory()
    }));
});


// Запуск наблюдения за каталогом
ipcMain.handle('start-watch', async (event, dir) => {
    const targetDir = path.resolve(dir || '.');

    // Если наблюдение уже запущено, то сначала закрываем предыдущий watcher
    if (watcher) {
        watcher.close();
        watcher = null;
    }

    watchedDir = targetDir;

    // Запоминаем содержимое каталога до начала наблюдения
    knownEntries = new Set(
        await fsp.readdir(watchedDir)
    );


    watcher = fs.watch(watchedDir, async () => {
        try {
            const currentEntries =
                await fsp.readdir(watchedDir);

            const currentSet =
                new Set(currentEntries);


            // Ищем элементы, которых раньше не было
            for (const name of currentSet) {

                if (!knownEntries.has(name)) {

                    const fullPath =
                        path.join(watchedDir, name);

                    try {
                        const stat =
                            await fsp.stat(fullPath);

                        // Уведомляем именно о новом файле
                        if (!stat.isFile()) {
                            continue;
                        }


                        // Системное уведомление
                        if (Notification.isSupported()) {
                            new Notification({
                                title: 'Новый файл',
                                body:
                                    `В каталоге появился файл: ${name}`
                            }).show();
                        }


                        // Передаем событие renderer-процессу
                        if (
                            mainWindow &&
                            !mainWindow.isDestroyed()
                        ) {
                            mainWindow.webContents.send(
                                'file-added',
                                name
                            );
                        }

                    } catch (error) {
                        // Файл мог быть удален до завершения проверки
                    }
                }
            }


            // Сохраняем новое состояние каталога
            knownEntries = currentSet;

        } catch (error) {

            if (
                mainWindow &&
                !mainWindow.isDestroyed()
            ) {
                mainWindow.webContents.send(
                    'watch-error',
                    error.message
                );
            }
        }
    });


    return {
        ok: true,
        dir: watchedDir
    };
});


// Остановка наблюдения
ipcMain.handle('stop-watch', () => {

    if (watcher) {
        watcher.close();
        watcher = null;
    }

    watchedDir = null;
    knownEntries = new Set();

    return {
        ok: true
    };
});


app.whenReady().then(() => {

    createWindow();

    app.on('activate', () => {

        if (
            BrowserWindow.getAllWindows().length === 0
        ) {
            createWindow();
        }
    });
});


app.on('window-all-closed', () => {

    if (process.platform !== 'darwin') {
        app.quit();
    }
});


app.on('before-quit', () => {

    if (watcher) {
        watcher.close();
    }
});