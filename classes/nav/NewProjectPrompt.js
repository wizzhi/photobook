class NewProjectDialog {
    constructor() {
        const promptDocument = new DOMParser().parseFromString(this.promptTemplate, `text/html`);
        this.element = promptDocument.querySelector(`.new-project-prompt`);
        this.addConfirmHook();
        this.addCancelHook();
    }

    addConfirmHook = () => {
        const confirmButton = this.element.querySelector(`.answer-yes`);
        confirmButton.addEventListener(`click`, () => {
            document.location.reload();
        });
    }

    addCancelHook = () => {
        const rejectButton = this.element.querySelector(`.answer-no`);
        rejectButton.addEventListener(`click`, () => {
            this.element.remove();
        });
    }

    promptTemplate = `
        <div class="new-project-prompt">
            <h2 class="new-project-title">新建相册</h2>
            <p class="new-project-message">新建相册将会清除现在的所有修改！
                <br /> <br />
                确定是要新建吗?
            </p>
            <div class="new-project-button-wrapper">
                <button class="answer-yes">新建</button>
                <button class="answer-no">暂不</button>
            </div>
        </div>`;
}
