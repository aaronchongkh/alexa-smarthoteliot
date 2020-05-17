/// <reference types="node" />
import { IRaspistillExecutor } from './interfaces';
export declare class DefaultRaspistillExecutor implements IRaspistillExecutor {
    static readonly FORCE_CLOSE_SIGNAL: string;
    private childProcess;
    private command;
    private maxBuffer;
    exec(args: string[]): Promise<Buffer>;
    spawnAndGetImage(args: string[]): Promise<Buffer>;
    spawnAndGetImages(args: string[], cb: (image: Buffer) => any): Promise<void>;
    killProcess(): void;
}
