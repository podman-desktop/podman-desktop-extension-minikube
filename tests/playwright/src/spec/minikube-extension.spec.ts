import { 
    expect as playExpect, 
    ExtensionsPage,  
    ResourcesPage, 
    test, 
    waitForPodmanMachineStartup, 
} from '@podman-desktop/tests-playwright';

const RESOURCE_NAME: string = 'minikube';
const EXTENSION_IMAGE: string = 'ghcr.io/containers/podman-desktop-extension-minikube:latest';
const EXTENSION_NAME: string = 'minikube';
const EXTENSION_LABEL: string = 'podman-desktop.minikube';

let extensionsPage: ExtensionsPage; 

const skipExtensionInstallation = process.env.SKIP_EXTENSION_INSTALL ? process.env.SKIP_EXTENSION_INSTALL : false;

test.beforeAll(async ({ runner, page, welcomePage }) => {
    runner.setVideoAndTraceName('minikube-extension-e2e');
    await welcomePage.handleWelcomePage(true);
    await waitForPodmanMachineStartup(page);
    extensionsPage = new ExtensionsPage(page); 
});

test.afterAll(async ({ runner }) => {
    await runner.close();   
});

test.describe.serial('Podman Desktop Minikube Extension Tests', () => {

    test('Install Minikube extension from OCI image', async ({ navigationBar }) => {
        test.skip(!!skipExtensionInstallation, 'Skipping extension installation');
        
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        await playExpect.poll(async () => extensionsPage.extensionIsInstalled(EXTENSION_LABEL)).toBeFalsy();
        await extensionsPage.openCatalogTab();
        await extensionsPage.installExtensionFromOCIImage(EXTENSION_IMAGE);
    });

    test('Verify Minikube extension is installed and active', async ({ navigationBar }) => {
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        await playExpect.poll(async () => extensionsPage.extensionIsInstalled(EXTENSION_LABEL)).toBeTruthy();
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        await playExpect(minikubeExtension.status).toHaveText('ACTIVE');
    });

    test('Ensure Minikube extension details page is correctly displayed', async () => {
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        const minikubeDetails = await minikubeExtension.openExtensionDetails('Minikube extension');
        await playExpect(minikubeDetails.heading).toBeVisible();
        await playExpect(minikubeDetails.status).toHaveText('ACTIVE');
        await playExpect(minikubeDetails.tabContent).toBeVisible();
    });

    test('Test Minikube extension lifecycle', async ({ navigationBar, page }) => {
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        
        const resourcesPage = new ResourcesPage(page);
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        await minikubeExtension.disableExtension();
        await navigationBar.openSettings();
        await playExpect.poll(async () => resourcesPage.resourceCardIsVisible(RESOURCE_NAME)).toBeFalsy();

        await navigationBar.openExtensions();
        await minikubeExtension.enableExtension();
        await navigationBar.openSettings();
        await playExpect.poll(async () => resourcesPage.resourceCardIsVisible(RESOURCE_NAME)).toBeTruthy();
    });

    test('Uninstall Minikube extension', async ({ navigationBar }) => {
        await navigationBar.openExtensions();
        await playExpect(extensionsPage.header).toBeVisible();
        const minikubeExtension = await extensionsPage.getInstalledExtension(EXTENSION_NAME, EXTENSION_LABEL);
        await minikubeExtension.removeExtension();
    });
});
