import { toSHA256 } from '@taqueria/protocol/SHA256';
import * as vscode from 'vscode';
import { HasRefresh, mapAsync, VsCodeHelper } from '../helpers';
import * as Util from '../pure';
import { getRunningContainerNames } from '../pure';

export class SandboxesDataProvider implements vscode.TreeDataProvider<SandboxTreeItem>, HasRefresh {
	constructor(
		private workspaceRoot: string,
		private helper: VsCodeHelper,
	) {}

	getTreeItem(element: SandboxTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: SandboxTreeItem): Promise<SandboxTreeItem[]> {
		if (element) {
			return [];
		}
		const [{ config, pathToDir }, runningContainers] = await Promise.all([
			this.getConfig(),
			getRunningContainerNames(),
		]);
		if (!pathToDir || !config?.config?.sandbox) {
			return [];
		}
		const environmentNames = this.getEnvironmentNames(config);

		const sandboxNames = this.getSandboxNames(config);
		const items = await mapAsync(
			sandboxNames,
			async (sandboxName: string) =>
				new SandboxTreeItem(
					sandboxName,
					await this.getSandboxState(sandboxName, runningContainers, environmentNames, pathToDir),
					vscode.TreeItemCollapsibleState.None,
				),
		);

		return items;
	}

	private _onDidChangeTreeData: vscode.EventEmitter<SandboxTreeItem | undefined | null | void> = new vscode
		.EventEmitter<
		SandboxTreeItem | undefined | null | void
	>();
	readonly onDidChangeTreeData: vscode.Event<SandboxTreeItem | undefined | null | void> =
		this._onDidChangeTreeData.event;

	private async getConfig(): Promise<{ config: Util.TaqifiedDir | null; pathToDir: Util.PathToDir | null }> {
		if (!this.workspaceRoot) {
			return {
				pathToDir: null,
				config: null,
			};
		} else {
			try {
				const pathToDir = await Util.makeDir(this.workspaceRoot, this.helper.i18n);
				const config = await Util.TaqifiedDir.create(pathToDir, this.helper.i18n);
				return {
					config,
					pathToDir,
				};
			} catch (e: unknown) {
				await this.helper.notifyAndLogError('Error while loading config, sandboxes list will fail to populate', e);
				return {
					pathToDir: null,
					config: null,
				};
			}
		}
	}

	async getSandboxState(
		sandBoxName: string,
		runningContainerNames: string[] | undefined,
		environmentNames: string[],
		pathToDir: string,
	) {
		if (runningContainerNames === undefined) {
			return undefined;
		}
		for (const environmentName of environmentNames) {
			const expectedContainerName = await this.getContainerName(sandBoxName, environmentName, pathToDir);
			if (runningContainerNames.findIndex(x => x === expectedContainerName) >= 0) {
				return true;
			}
		}
		return false;
	}

	// TODO: The functions getUniqueSandboxName and getContainerName are duplicates of similarly named functions in
	// taqueria-plugin-flextesa/proxy.ts. As suggested in https://github.com/ecadlabs/taqueria/issues/1030, we need to
	// take care of this tech debt.
	private async getUniqueSandboxName(sandboxName: string, projectDir: string) {
		const hash = await toSHA256(projectDir);
		return `${sandboxName}-${hash}`;
	}

	async getContainerName(sandboxName: string, environmentName: string, projectDir: string) {
		const uniqueSandboxName = await this.getUniqueSandboxName(sandboxName, projectDir);
		return `taqueria-${environmentName}-${uniqueSandboxName}`;
	}

	private getEnvironmentNames(config: Util.TaqifiedDir): string[] {
		if (!config?.config?.environment) {
			return [];
		}
		const environments = Object.entries(config.config.environment);
		const nonDefaultEnvironments = environments.filter(environment => environment[0] !== 'default');
		nonDefaultEnvironments.sort((a, b) => a[0].localeCompare(b[0]));
		return nonDefaultEnvironments.map(e => e[0]);
	}

	private getSandboxNames(config: Util.TaqifiedDir): string[] {
		if (!config?.config?.sandbox) {
			return [];
		}
		const sandboxes = Object.entries(config.config.sandbox);
		sandboxes.sort((a, b) => a[0].localeCompare(b[0]));
		return sandboxes.map(sandbox => sandbox[0]);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}
}
export class SandboxTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		private running: boolean | undefined,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
	) {
		super(label, collapsibleState);
		if (running === undefined) {
			this.tooltip = this.label;
			this.description = undefined;
			this.iconPath = new vscode.ThemeIcon('question');
			this.contextValue = 'unknown';
		} else {
			this.tooltip = `${this.label}-${running ? 'running' : 'stopped'}`;
			this.description = running ? 'running' : 'stopped';
			this.iconPath = new vscode.ThemeIcon(running ? 'vm-running' : 'vm-outline');
			this.contextValue = running ? 'running' : 'stopped';
		}
	}
}