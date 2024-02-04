import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

class GitHubConnection {
	server: string
	pat: string

	constructor(server: string, pat: string) {
		this.server = server;
		this.pat = pat;
	}
}

interface MyPluginSettings {
	gitHubConnections: GitHubConnection[]
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	gitHubConnections: []
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class GitHubServerConfig {
	plugin: MyPlugin
	cnx: GitHubConnection

	constructor(plugin: MyPlugin, cnx: GitHubConnection, containerEl: HTMLElement) {
		this.plugin = plugin
		this.cnx = cnx
		new Setting(containerEl)
			.setName('GitHub URL')
			.setDesc('The base GitHub or GitHub Enterprise URL, e.g. github.com or github.acme.com')
			.addText(text => text
				.setValue(cnx.server)
				.onChange(async (value) => {
					console.log(" value changed")
					cnx.server = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('GitHub Personal Access Token')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(cnx.pat)
				.onChange(async (value) => {
				cnx.pat = value;
					await this.plugin.saveSettings();
				}));
		new ButtonComponent(containerEl)
			.setButtonText("Test Connection")
			.onClick(async (_) => {
				console.log("Testing connection to " + cnx.server);
				try {
					// Perform authentication and connection test here
					// For example, you can use the GitHub API to fetch user information
					const response = await fetch(cnx.server + "/user", {
						headers: {
							Authorization: `token ${cnx.pat}`
						}
					});
					if (response.ok) {
						console.log("Connection successful!");
					} else {
						console.log("Connection failed!");
					}
				} catch (error) {
					console.log("An error occurred while testing the connection:", error);
				}
			});

	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setHeading()
			.setName("GitHub Servers")
			.addButton(button => button
				.setButtonText("Add GitHub server")
				.onClick(async (_) => {
					const cnx = new GitHubConnection("https://github.com", "")
					this.plugin.settings.gitHubConnections.push(cnx)
					new GitHubServerConfig(this.plugin, cnx, containerEl);
					await this.plugin.saveSettings();
				})
			);
		
			for (const cnx of this.plugin.settings.gitHubConnections) {
				new GitHubServerConfig(this.plugin, cnx, containerEl);
			}
	}
}
