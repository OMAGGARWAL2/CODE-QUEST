window.addEventListener("load", function() {

  const scoreEditHistoryModal = document.getElementById("score-edit-history-modal");
  const modalCloseButton = document.getElementById("close-score-edit-history-modal-button");
  /** @type {HTMLTableSectionElement} */
  const scoreEditHistoryTableBody = document.getElementById("score-edit-history-table-body");

  modalCloseButton?.addEventListener("click", () => scoreEditHistoryModal.classList.remove("visible"));
  window.addEventListener("click", event => {
    if(event.target === scoreEditHistoryModal) {
      scoreEditHistoryModal.classList.remove("visible");
    }
  });

  async function openScoreEditHistoryModal(questionId, questionTitle) {
    $("#scoreEditHistoryModalTitle").text(questionTitle);
    toggleLoader(true);
    try {
      const url = new URL("/api/useranswer/updateScoreLog", window.location.origin);
      url.searchParams.set("courseId", courseId);
      url.searchParams.set("userId", currentStudentId);
      url.searchParams.set("questionId", questionId);
      const response = await fetch(url);
      /** @type {{ error: string } | { createdAt: string; previousScore: number; updatedScore: number; createdBy: { displayname: string; email: string; _id: string } }[]} */
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      emptyTableBody();
      fillTableBody(data);
      toggleLoader(false);
      scoreEditHistoryModal.classList.add("visible");
    } catch (error) {
      console.log(error);
      toggleLoader(false);
      toggleAlertMsgModal("Failed to load score edit history", 2);
    }
  }

  this.openScoreEditHistoryModal = openScoreEditHistoryModal;

  function createRow(...args) {
    const row = scoreEditHistoryTableBody.insertRow();
    for(const arg of args) {
      row.insertCell().textContent = arg;
    }
  }

  /** @param {{ createdAt: string; previousScore: number; updatedScore: number; createdBy: { displayname: string; email: string; _id: string } }[]} rows */
  function fillTableBody(rows) {
    for(const [ index, row ] of rows.entries()) {
      const createdAt = formatTime(row.createdAt);
      createRow(index + 1, row.previousScore, row.updatedScore, createdAt, row.createdBy.displayname);
    }
  }

  function emptyTableBody() {
    while(scoreEditHistoryTableBody.rows.length > 0) {
      scoreEditHistoryTableBody.deleteRow(0);
    }
  }

});

function formatTime(timeString) {
  let timeDate = new Date(timeString);
  let hours = timeDate.getHours();
  let minutes = timeDate.getMinutes();

  let hr = hours<10 ? '0'+hours : hours;
  let min = minutes < 10 ? '0'+minutes : minutes;

  let date = timeDate.getDate();
  if(date<10){
    date = `0${timeDate.getDate()}`
  }
  let month = (timeDate.getMonth()+1);
  if(month < 10){
    month = `0${(timeDate.getMonth()+1)}`
  }
  return `${date}-${month}-${timeDate.getFullYear()} ${hr}:${min}`;
}

/** @typedef {[ page: number ] | [ start: number, end: number ]} PageNumberRange */

class FileWriteStream extends EventTarget {

  /** @type {string | undefined} */
  #url;
  /** @type {File | null} */
  #file = null;
  #data = [];

  get file() {
    return this.#file;
  }

  get url() {
    if(this.#file === null) {
      return;
    }
    if(this.#url !== undefined) {
      URL.revokeObjectURL(this.#url);
    }
    this.#url = URL.createObjectURL(this.#file);
    return this.#url;
  }

  set url(url) {
    if(url === undefined && this.#url !== undefined) {
      URL.revokeObjectURL(this.#url);
    }
  }

  /** @param {((this: FileWriteStream, event: Event) => void)} listener */
  on(eventName, listener) {
    super.addEventListener(eventName, listener);
  }
  /** @param {((this: FileWriteStream, event: Event) => void)} listener */
  once(eventName, listener) {
    super.addEventListener(eventName, listener, { once: true });
  }
  /** @param {((this: FileWriteStream, event: Event) => void)} listener */
  off(eventName, listener) {
    super.removeEventListener(eventName, listener);
  }
  emit(eventName, args = []) {
    super.dispatchEvent(new CustomEvent(eventName, { detail: args }));
  }
  write(data) {
    this.#data.push(data);
  }
  end() {
    this.#file = new File(this.#data, Date.now() + ".pdf", { type: "application/pdf" });
    this.emit("end");
  }
};

class CourseUserPDF {
  #data;
  #course;
  #user;
  #frontPageColumns;
  #frontPageLogoBuffer;
  /** @type {PDFKit.PDFDocument} */
  #pdfDoc = new PDFDocument({ layout: "portrait", size: "A4", bufferPages: true });
  #fileStream = new FileWriteStream;
  #anchorElement = document.createElement("a");

  /**
   * @param {{ title: string }} course
   * @param {{ displayName: string; email: string }} user
   * @param {{ [property: string]: string }} frontPageColumns
   * @param {{ title: string; description: CourseUserReport["descriptionFormat"]; answer: string; answerStatus: "NOT_ATTEMPTED" | "CORRECT_ANSWER" | "NO_CORRECT_ANSWER" }[]} questions
   * @param {{ frontPageLogoBuffer: ArrayBuffer }} assets
   */
  constructor(course, user, frontPageColumns, questions, assets = {}) {
    this.#course = course;
    this.#user = user;
    this.#frontPageColumns = frontPageColumns;
    this.#data = questions;
    this.#frontPageLogoBuffer = assets.frontPageLogoBuffer;
    this.#pdfDoc.on("pageAdded", () => this.#createPageWatermark());
  }

  /** @param {{ singleQuestion?: boolean }} [options] */
  async create(options) {
    await new Promise(resolve => {
      const onerror = error => {
        this.#fileStream.off("end", onend);
        this.#pdfDoc.unpipe(this.#fileStream);
        reject(error);
      };
      const onend = () => {
        const filename = `${ this.#user.displayName }_${ this.#course.title }${ options?.singleQuestion ? `_${ this.#data[0].title }` : "" }.pdf`;
        this.#anchorElement.download = filename;
        this.#anchorElement.href = this.#fileStream.url;
        this.#anchorElement.target = "_blank";
        this.#fileStream.off("error", onerror);
        this.#pdfDoc.unpipe(this.#fileStream);
        resolve();
      };
      this.#fileStream.once("error", onerror);
      this.#fileStream.once("end", onend);
      this.#pdfDoc.pipe(this.#fileStream);
      if(options?.singleQuestion) {
        return void this.#createSingleQuestionPages(this.#data[0]);
      }
      this.#createAllPages();
    });
  }

  download() {
    this.#anchorElement.click();
  }

  #saveAndEnd() {
    this.#pdfDoc.save();
    this.#pdfDoc.end();
  }

  /**
   * @param {ConstructorParameters<typeof CourseUserPDF>[2][number]} question
   * @returns {[] | [ page: number ] | [ start: number, end: number ]}
   */
  #createQuestionPages(question) {
    if(question.answerStatus === "NOT_ATTEMPTED" || question.answerStatus === "NO_CORRECT_ANSWER") {
      return [];
    }
    this.#pdfDoc.addPage();
    const startPageNumber = this.#pdfDoc.bufferedPageRange().count;
    this.#createContentHeading(`Aim: ${ question.title }`);
    this.#pdfDoc.moveDown(0.5);
    this.#createContentDescription(question.description);
    this.#pdfDoc.moveDown(1);
    this.#createContentHeading("Solution:");
    this.#pdfDoc.moveDown(0.5);
    this.#createContentParagraph(question.answer);
    const endPageNumber = this.#pdfDoc.bufferedPageRange().count;
    return startPageNumber === endPageNumber ? [ startPageNumber ] : [ startPageNumber, endPageNumber ];
  }

  /** @param {ConstructorParameters<typeof CourseUserPDF>[2][number]} question */
  #createSingleQuestionPages(question) {
    this.#createFrontPage();
    const pagesRange = this.#createQuestionPages(question);
    for(const pageNumber of pagesRange) {
      this.#createHeaderFooter(pageNumber - 1);
    }
    this.#saveAndEnd();
  }

  /** @param {{ index: }} options */
  #createAllPages(options = {}) {
    this.#createFrontPage();
    /** @type {{ range?: PageNumberRange, set: (content: PageNumberRange) => void }[]} */
    const pagesCells = new Array(this.#data.length);
    const indexPageRange = this.#createIndexPage(pagesCells);

    for(const [ index, question ] of this.#data.entries()) {
      pagesCells[index] = { range: this.#createQuestionPages(question), set: () => {} };
    }

    for(const pagesCell of pagesCells) {
      if(pagesCell.range === undefined) {
        continue;
      }
      if(pagesCell.set) {
        pagesCell.set(pagesCell.range);
      }
    }

    for(let pageNumber = indexPageRange[1]; pageNumber < this.#pdfDoc.bufferedPageRange().count; pageNumber++) {
      this.#createHeaderFooter(pageNumber);
    }

    this.#saveAndEnd();

  }

  /** @param {number} pageNumber */
  #createHeaderFooter(pageNumber) {
    this.#pdfDoc.switchToPage(pageNumber);
    this.#createHeader(`Department of CSE`, "left");
    this.#createHeader(`Lab Manual: ${ this.#course.title }`, "right");
    this.#createHeaderLine();
    this.#createFooter(`${ pageNumber + 1 }`, "center", 0.5);
    this.#createFooter(this.#user.displayName, "right");
    this.#createFooter(this.#user.email, "right", 1);
    this.#createFooterLine();
    this.#pdfDoc.text("", this.#pdfDoc.page.margins.left, this.#pdfDoc.page.margins.top);
  }

  #createFrontPage() {
    const { page } = this.#pdfDoc;
    this.#createPageWatermark();
    const workingWidth = page.width - page.margins.left - page.margins.right;
    const logoPositionX = (page.width - 200) / 2;
    const logoPositionY = page.margins.top + 10;
    if(this.#frontPageLogoBuffer) {
        try {
            this.#pdfDoc.image(this.#frontPageLogoBuffer, logoPositionX, logoPositionY, { width: 200 });
        } catch(e) {}
    }
    this.#pdfDoc.moveDown(8);
    this.#pdfDoc.font("Helvetica-Bold");
    this.#pdfDoc.fontSize(14);
    this.#pdfDoc.text("Department of Computer Science & Engineering", { align: "center" });

    this.#pdfDoc
      .rect(page.margins.left + 30, 226, workingWidth - 60, 2)
      .rect(page.margins.left + 30, 306, workingWidth - 60, 2)
      .strokeColor("#ccc")
      .stroke();

    const hasCourseCode = this.#course.code !== undefined;

    this.#pdfDoc.moveDown(hasCourseCode ? 2.6 : 3);
    this.#pdfDoc.fontSize(12);
    this.#pdfDoc.text("LAB MANUAL", { align: "center" });
    if(hasCourseCode) {
      this.#pdfDoc.moveDown(0.25);
      this.#pdfDoc.text("CS161", { align: "center" });
      this.#pdfDoc.moveDown(0.25);
    } else {
      this.#pdfDoc.moveDown(0.75);
    }
    this.#pdfDoc.text(`${ this.#course.title }`, { align: "center" });
    this.#pdfDoc.moveDown(0.5);

    const cellWidth = workingWidth / 2;
    const columnDescription = { width: cellWidth, bold: true };
    this.#createHeaderLessTable(
      /** @type {const} */([ columnDescription, columnDescription ]),
      Object.entries(this.#frontPageColumns),
      {
        offsetX: page.margins.left,
        offsetY: 400,
        cellPadding: [ 8 ]
      }
    );

    this.#pdfDoc.text("Faculty Incharge", page.margins.left, page.height - page.margins.bottom - 34, {
      width: workingWidth,
      align: "right"
    });
    this.#pdfDoc.text("______________", page.margins.left, page.height - page.margins.bottom - 18, {
      width: workingWidth,
      align: "right"
    });
  }

  /**
   * @param {{ range: PageNumberRange, set: (content: PageNumberRange) => void }[]} pagesCells
   * @returns {[ start: number, end: number ]}
   */
  #createIndexPage(pagesCells) {
    this.#pdfDoc.addPage();
    const startPageNumber = this.#pdfDoc.bufferedPageRange().count;

    this.#createIndexTableCaption();

    const offsetX = this.#pdfDoc.page.margins.left;
    const offsetY = this.#pdfDoc.page.margins.top + this.#pdfDoc.currentLineHeight(true) * 1.5;
    let rowOffsetY = this.#createIndexTableHeadRow(offsetX, offsetY);
    for(const [ index, question ] of this.#data.entries()) {
      const { rowOffset, setPagesCellContent } = this.#createIndexTableBodyRow([
        index + 1,
        CourseUserPDF.sanitizeText(question.title),
        question.answerStatus === "CORRECT_ANSWER" ? undefined
          : question.answerStatus === "NO_CORRECT_ANSWER" ? "Incorrect Answer"
          : "Not Attempted"
      ], offsetX, rowOffsetY);
      rowOffsetY = rowOffset;
      pagesCells[index] = pagesCells[index] || {};
      pagesCells[index].set = setPagesCellContent;
      this.#pdfDoc.moveDown(0.5);
    }

    const endPageNumber = this.#pdfDoc.bufferedPageRange().count;

    return [ startPageNumber, endPageNumber ];
  }

  /**
   * @param {string} text
   * @param {"left" | "center" | "right"} align
   */
  #createFooter(text, align, line = 0) {
    const textWidth = this.#pdfDoc.widthOfString(text);
    const margin = 32;
    const x = align === "right" ? this.#pdfDoc.page.width - textWidth - margin : align === "left" ? margin : (this.#pdfDoc.page.width - textWidth) / 2 ;
    const y = this.#pdfDoc.page.height - margin;
    this.#pdfDoc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#888")
      .text(text, x, y + line * 10, { align, lineBreak: false });
  }

  /**
   * @param {string} text
   * @param {"left" | "center" | "right"} align
   */
  #createHeader(text, align) {
    const textWidth = this.#pdfDoc.widthOfString(text);
    const margin = 32;
    const x = align === "right" ? this.#pdfDoc.page.width - textWidth - margin : align === "left" ? margin : (this.#pdfDoc.page.width - textWidth) / 2 ;
    const y = margin;
    this.#pdfDoc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#888")
      .text(text, x, y, { align, lineBreak: false  });
  }

  #createHeaderLine() {
    const margin = 32;
    const top = margin + this.#pdfDoc.currentLineHeight(true) + 4;
    this.#pdfDoc
      .moveTo(margin, top)
      .lineTo(this.#pdfDoc.page.width - margin, top)
      .lineWidth(1)
      .strokeColor("#ccc")
      .stroke();
  }

  #createFooterLine() {
    const margin = 32;
    const bottom = this.#pdfDoc.page.height - margin - this.#pdfDoc.currentLineHeight(true) + 4;
    this.#pdfDoc
      .moveTo(margin, bottom)
      .lineTo(this.#pdfDoc.page.width - margin, bottom)
      .lineWidth(1)
      .strokeColor("#ccc")
      .stroke();
  }

  /** @param {string} text */
  #createContentHeading(text) {
    this.#pdfDoc
      .font("Times-Bold")
      .fontSize(12)
      .text(CourseUserPDF.sanitizeText(text), { align: "left" });
  }

  /** @param {string} text */
  #createContentParagraph(text) {
    this.#pdfDoc
      .font("Times-Roman")
      .fontSize(12)
      .text(CourseUserPDF.sanitizeText(text), { align: "left" });
  }

  /** @param {CourseUserReport["descriptionFormat"]} descriptionItems */
  #createContentDescription(descriptionItems) {
    for(const item of descriptionItems) {
      if(typeof item.insert !== "string") {
        try {
          const { page, y } = this.#pdfDoc;
          const imageBottom = y + 200;
          const writableBottom = page.height - page.margins.bottom;
          if(imageBottom >= writableBottom) {
            this.#pdfDoc.addPage();
          }
          this.#pdfDoc.image(item.insert.image, { fit: [ 200, 200 ] });
          this.#pdfDoc.fontSize(200);
        } catch(ex) {
          this.#pdfDoc.text(`[image:${ item.insert.image }]`);
        }
        continue;
      }
      const isContinued = !item.insert.startsWith("\n");
      const isFontBold = item.attributes?.heading || item.attributes?.bold;
      const isFontBoldItalic = isFontBold && item.attributes?.italic;
      const font = item.attributes?.["code-block"] ? "Times-Roman"
        : isFontBoldItalic ? "Times-BoldItalic"
          : isFontBold ? "Times-Bold"
            : item.attributes?.italic ? "Times-Italic"
              : "Times-Roman";
      let fontSize = 12;
      switch(item.attributes?.heading) {
        case 1: fontSize = 16 * 2.5;
        break;
        case 2: fontSize = 16 * 2;
        break;
        case 3: fontSize = 16 * 1.75;
        break;
        case 4: fontSize = 16 * 1.5;
        break;
        case 5: fontSize = 16 * 1.25;
        break;
        case 6: fontSize = 16;
        break;
      }
      if(!isContinued || this.#pdfDoc._font?.name !== font || this.#pdfDoc._fontSize !== fontSize) {
        this.#pdfDoc.font(font).fontSize(fontSize);
      }
      this.#pdfDoc.text(CourseUserPDF.sanitizeText(item.insert), {
        align: "left",
        indent: (item.attributes?.indent ?? 0) * 16,
        link: item.attributes?.attachment,
        underline: item.attributes?.attachment !== undefined || item.attributes?.underline,
        strike: item.attributes?.strike,
        continued: isContinued
      });
    }
    this.#pdfDoc.fontSize(16);
  }

  /** @type {{ id: string; name: string; width: number; align?: "center" | "justify" | "left" | "right" }[]} */
  #indexColumns = [
    { name: "S.No.", width: 55, align: "center" },
    { name: "Aim", width: 280 },
    { name: "Pages", width: 120, align: "center" }
  ];

  #createIndexTableCaption() {
    this.#pdfDoc
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Table of Contents", { align: "center" });
  }

  /**
   * @param {{ id?: string; name?: string; width?: number; align?: "center" | "justify" | "left" | "right"; bold?: boolean }[]} columns
   * @param {string[][]} rows
   * @param {{ offsetX?: number; offsetY?: number; cellPadding?: [ x: number, y: number ] | [ xy: number ]; }} options
   */
  #createHeaderLessTable(columns, rows, options = {}) {
    let offsetY = options?.offsetY;
    for(const row of rows) {
      offsetY = this.#createHeaderLessTableRow(columns, row, options?.offsetX, offsetY, options.cellPadding);
    }
  }

  /**
   * @param {{ id?: string; name?: string; width?: number; align?: "center" | "justify" | "left" | "right"; bold?: boolean }[]} columns
   * @param {string[]} cells
   * @param {[ x: number, y: number ] | [ xy: number ]} cellPadding
   */
  #createHeaderLessTableRow(columns, cells, offsetX = 0, offsetY = 0, cellPadding = []) {
    let x = offsetX;
    let y = offsetY;
    const paddingX = cellPadding[0] ?? 0;
    const paddingY = cellPadding[1] ?? paddingX;
    let rowHeight = 0;
    for(const [ columnIndex, data ] of cells.entries()) {
      const column = columns[columnIndex];
      /** @type {PDFKit.Mixins.TextOptions} */
      const textOptions = {
        align: column.align ?? "left",
        width: column.width - paddingX * 2
      };
      this.#pdfDoc
        .font(column.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(11);
      const contentHeight = this.#pdfDoc.heightOfString(data || "", textOptions) + paddingY * 2;
      if(contentHeight > rowHeight) {
        rowHeight = contentHeight;
      }
    }
    for(const [ columnIndex, column ] of columns.entries()) {
      const cellContentX = x + paddingX;
      const cellContentY = y + paddingY * 1.25;
      /** @type {PDFKit.Mixins.TextOptions} */
      const textOptions = {
        align: column.align ?? "left",
        width: column.width - paddingX * 2
      };
      this.#pdfDoc.rect(x - 1, y - 1, column.width, rowHeight).strokeColor("#000").stroke();
      this.#pdfDoc
        .font(column.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(11)
        .text(cells[columnIndex] ?? "", cellContentX, cellContentY, textOptions);
      x += column.width;
    }
    return y + rowHeight;
  }

  #createIndexTableHeadRow(offsetX = 0, offsetY = 0) {
    let x = offsetX;
    let y = offsetY;
    const padding = 10;
    let rowHeight = 0;
    for(const column of this.#indexColumns) {
      /** @type {PDFKit.Mixins.TextOptions} */
      const textOptions = {
        align: "center",
        width: column.width - padding * 2,
      };
      this.#pdfDoc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(column.name, x + padding, y + padding * 1.25, textOptions);
      rowHeight = this.#pdfDoc.heightOfString(column.name, textOptions) + padding * 2;
      this.#pdfDoc.rect(x - 1, y - 1, column.width, rowHeight).stroke();
      x += column.width;
    }
    return y + rowHeight;
  }

  /** @param {(string | number)[]} cells */
  #createIndexTableBodyRow(cells, offsetX = 0, offsetY = 0) {
    let x = offsetX;
    let y = offsetY;
    const padding = 10;
    let rowHeight = 0;
    for(const [ columnIndex, data ] of cells.entries()) {
      const column = this.#indexColumns[columnIndex];
      /** @type {PDFKit.Mixins.TextOptions} */
      const textOptions = {
        align: column.align ?? "left",
        width: column.width - padding * 2,
      };
      const contentHeight = this.#pdfDoc.heightOfString(String(data || ""), textOptions) + padding * 2;
      if(contentHeight > rowHeight) {
        rowHeight = contentHeight;
      }
    }

    let pageNumber = this.#pdfDoc.bufferedPageRange().count;

    if(this.#pdfDoc.page.height < y + rowHeight + this.#pdfDoc.page.margins.bottom) {
      this.#pdfDoc.addPage();
      pageNumber = this.#pdfDoc.bufferedPageRange().count;
      y = this.#pdfDoc.page.margins.top;
    }

    let cellContentX, cellContentY;
    /** @type {PDFKit.Mixins.TextOptions} */
    let textOptions;
    for(const [ columnIndex, column ] of this.#indexColumns.entries()) {
      cellContentX = x + padding;
      cellContentY = y + padding * 1.25;
      textOptions = {
        align: column.align ?? "left",
        width: column.width - padding * 2,
      };
      this.#pdfDoc.rect(x - 1, y - 1, column.width, rowHeight).stroke();
      this.#pdfDoc
        .font("Helvetica")
        .fontSize(11)
        .text(String(cells[columnIndex] ?? ""), cellContentX, cellContentY, textOptions);
      x += column.width;
    }

    return {
      rowOffset: y + rowHeight,
      /** @param {PageNumberRange} content */
      setPagesCellContent: content => {
        if(!content) return;
        textOptions.link = content[0] - 1;
        this.#pdfDoc.switchToPage(pageNumber - 1);
        this.#pdfDoc
          .font("Times-Roman")
          .fontSize(12)
          .text(content.join(" - "), cellContentX, cellContentY, textOptions);
      }
    };
  }

  #createPageWatermark() {
    const { page } = this.#pdfDoc;
    this.#pdfDoc.fillColor("#000");
    const logoPositionX = page.margins.left * 1.5;
    const logoPositionY = page.height - 200;
    const width = page.width - (page.margins.left + page.margins.right) * 1.5;
    if(this.#frontPageLogoBuffer) {
        try {
            this.#pdfDoc
            .opacity(0.06)
            .image(this.#frontPageLogoBuffer, logoPositionX, logoPositionY, { width })
            .opacity(1);
        } catch(e) { this.#pdfDoc.opacity(1); }
    }
  }

  /** @param {string} url */
  static async imageAsBuffer(url) {
    try {
        const response = await fetch(url);
        return await response.arrayBuffer();
    } catch(e) { return null; }
  }

  /** @param {string} text */
  static sanitizeText(text) {
    return String(text || "").replace(/\t/g, "  ");
  }

};

/** @typedef {{ course: {}; user: {}; sections: { title: string; questions: { title: string; text: string; attempts?: { correctAnswer?: string; userAttempts: {}[] } }[] }[] }} CourseUserReportFormat */

class CourseUserReport {
  #parser = new DOMParser;
  #courseId;
  #userId;
  #questionId;
  #sectionIndex;

  /**
   * @param {string} courseId
   * @param {string} userId
   * @param {{ questionId?: string; sectionIndex?: number }} options
   */
  constructor(courseId, userId, options) {
    this.#courseId = courseId;
    this.#userId = userId;
    this.#questionId = options?.questionId;
    this.#sectionIndex = options?.sectionIndex;
  }

  async #fetchCourseUserReport() {
    try {
      const url = new URL(`/api/course/courseAttempt/${ this.#courseId }/${ this.#userId }`, window.location.origin);
      if(this.#questionId) {
        url.searchParams.set("questionId", this.#questionId);
      }
      const response = await fetch(url);
      /** @type {{ error: string } | CourseUserReportFormat } */
      const data = await response.json();
      if(!response.ok) {
        throw data.error;
      }
      if("error" in data) {
        throw data.error;
      }
      return data;
    } catch(ex) {
      if(typeof toggleAlertMsgModal === 'function') toggleAlertMsgModal("Unable to get report data", 2);
      return null;
    }
  };

  get descriptionFormat() {
    return Array.from(this.parseQuestionDescription(""));
  }

  /**
   * @param {Node} node
   * @param {{ heading: number | undefined; bold: boolean; italic: boolean; underline: boolean; strike: boolean; attachment: string | undefined; indent: number; "code-block": boolean }} parentAttributes
   * @returns {Generator<{ attributes?: { heading: number | undefined; bold: boolean; italic: boolean; underline: boolean; strike: boolean; attachment: string | undefined; indent: number; "code-block": boolean }; insert: string | { image: string; }; }>}
  */
  *#questionDescriptionNode(node, parentAttributes = {}) {
    if(node instanceof HTMLElement === false) {
      yield { attributes: parentAttributes, insert: node.textContent };
      return;
    }
    let indent = 0;
    for(const token of node.classList) {
      if(token.startsWith("ql-indent-")) {
        indent = +token.replace("ql-indent-", "");
        break;
      }
    }
    const attributes = {
      heading: (tagName => {
        switch(tagName) {
          case "H1": return 1;
          case "H2": return 2;
          case "H3": return 3;
          case "H4": return 4;
          case "H5": return 5;
          case "H6": return 6;
        }
      })(node.tagName),
      bold: parentAttributes.bold || node.tagName === "STRONG" || node.tagName === "B",
      italic: parentAttributes.italic || node.tagName === "EM" || node.tagName === "I",
      underline: parentAttributes.underline || node.tagName === "U",
      strike: parentAttributes.strike || node.tagName === "S",
      attachment: node.tagName === "A" ? node.href : undefined,
      "code-block": node.tagName === "PRE",
      indent
    };
    if(attributes["code-block"] || node.children.length === 0) {
      yield {
        attributes,
        insert: node.tagName === "IMG" ? {
          image: node.src
        } : node.textContent
      };
      return;
    }
    for(const childNode of node.childNodes) {
      for(const content of this.#questionDescriptionNode(childNode, attributes)) {
        yield content;
      }
    }
  }

  /** @param {string} content */
  *parseQuestionDescription(content) {
    if(!content) return;
    const document = this.#parser.parseFromString(content, "text/html");
    for(const childElement of document.body.children) {
      let attributes;
      for(const content of this.#questionDescriptionNode(childElement)) {
        attributes ??= content.attributes ?? {}
        yield content;
      }
      yield { attributes, insert: "\n" };
    }
  }

  /** @param {CourseUserReportFormat["sections"]} sections */
  *#courseUserReportQuestions(sections = []) {
    const sectionsToTraverse = this.#sectionIndex === undefined ? sections : [ sections[this.#sectionIndex] ];
    for(const section of sectionsToTraverse) {
      for(const question of section.questions) {
        if(question === null) {
          continue;
        }
        const description = Array.from(this.parseQuestionDescription(question.text ? question.text.trim() : ""));
        yield {
          title: question.title ? question.title.trim() : "",
          description,
          answerStatus: "attempts" in question === false ? "NOT_ATTEMPTED"
            : "correctAnswer" in question.attempts ? "CORRECT_ANSWER" : "NO_CORRECT_ANSWER",
          answer: question.attempts?.correctAnswer || "",
          attempt: {},
          testCases: []
        };
      }
    }
  }

  /** @param {{ isChitkara?: boolean }} options */
  async download(options = {}) {
    if(typeof toggleLoader === 'function') toggleLoader(true);
    try {
      const reportData = await this.#fetchCourseUserReport();
      if (reportData === null) {
        if(typeof toggleLoader === 'function') toggleLoader(false);
        return;
      }
      const questions = Array.from(this.#courseUserReportQuestions(reportData.sections));
      const frontPageLogoBuffer = await CourseUserPDF.imageAsBuffer("/Report/assets/front-page-logo.png");
      const frontPageColumns = {
        "Student Name": reportData.user.displayname,
        [options.isChitkara ? "Roll Number" : "Email"]: [options.isChitkara ? reportData.user.enrollmentId : reportData.user.email],
        "Course Name": reportData.course.title
      };
      if(this.#sectionIndex !== undefined) {
        frontPageColumns["Module"] = reportData.sections[this.#sectionIndex].title;
      }
      const pdf = new CourseUserPDF({
        title: reportData.course.title,
        code: options.isChitkara ? reportData.course.code : undefined
      }, {
        displayName: reportData.user.displayname,
        email: reportData.user.email
      }, frontPageColumns, questions, { frontPageLogoBuffer });
      await pdf.create({ singleQuestion: Boolean(this.#questionId) });
      pdf.download();
      if(typeof toggleLoader === 'function') toggleLoader(false);
    } catch(ex) {
      if(typeof toggleLoader === 'function') toggleLoader(false);
      console.log(ex);
      if(typeof toggleAlertMsgModal === 'function') toggleAlertMsgModal("Failed to download data", 2);
    }
  }

};

async function downloadreportsforcourseattempt(courseId, userId, options) {
    const report = new CourseUserReport(courseId, userId, options);
    await report.download(options);
}

window.downloadreportsforcourseattempt = downloadreportsforcourseattempt;
