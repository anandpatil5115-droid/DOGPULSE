package com.ragchat;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

import java.io.File;

public class CreatePdf {
    public static void main(String[] args) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                contentStream.newLineAtOffset(50, 700);
                contentStream.showText("VTU CGPA Conversion Formula Document");
                contentStream.newLineAtOffset(0, -20);
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                contentStream.showText("To convert VTU CGPA to percentage, use the following formula: Percentage = (CGPA - 0.75) * 10.");
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("For example, if your CGPA is 8.0, your percentage is (8.0 - 0.75) * 10 = 7.25 * 10 = 72.5%.");
                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("This formula is official and applies to all engineering batches under VTU.");
                contentStream.endText();
            }

            document.save(new File("C:\\Users\\HI\\.gemini\\antigravity\\scratch\\test_vtu_formula.pdf"));
            System.out.println("PDF created successfully!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
