/// <reference types="node" />
import { AbstractWatcher } from './abstract';
import { IWatcher, IWatcherOptions } from './interfaces';
export declare class DefaultWatcher extends AbstractWatcher implements IWatcher {
    static readonly IMAGE_IN_PROGRESS_SYMBOL: string;
    static readonly FORCE_CLOSE_EVENT: string;
    static readonly ERROR_NO_PHOTO: string;
    private watcher;
    constructor(options?: IWatcherOptions);
    watchAndGetFile(filePath: string, options?: IWatcherOptions): Promise<Buffer>;
    watchAndGetFiles(dirPath: string, watchTimeMs: number, cb: (file: Buffer) => any): Promise<void>;
    closeWatcher(): void;
    private makeDir(dirName);
    private addForceCloseHandler(watcher, timer, reject);
}
