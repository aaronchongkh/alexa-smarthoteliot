/// <reference types="node" />
import { IWatcherOptions, IWatcher } from './interfaces';
export declare abstract class AbstractWatcher implements IWatcher {
    static readonly DEFAULT_OPTIONS: IWatcherOptions;
    private options;
    constructor(options?: IWatcherOptions);
    abstract watchAndGetFile(filePath: string, options?: IWatcherOptions): Promise<Buffer>;
    abstract watchAndGetFiles(dirPath: string, watchTimeMs: number, cb: (file: Buffer) => any): Promise<void>;
    abstract closeWatcher(): void;
    setOptions(options: IWatcherOptions): void;
    getOption(key: string): any;
    getOptions(): IWatcherOptions;
}
