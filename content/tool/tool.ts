export interface IScreenTool {
  readonly name: string;

  onActivate(): void;
  onDeactivate(): void;
  canBeSwitchedTo(tool: IScreenTool): boolean;
}