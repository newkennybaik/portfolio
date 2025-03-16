import java.io.*;

public class Read_text {
    public static void main(String[] args) throws IOException {
        BufferedReader scanner = new BufferedReader(new FileReader("test.txt"));
        String lnScanned;
        while ((lnScanned = scanner.readLine()) != null) {
            System.out.println(lnScanned);
        }
        scanner.close();
    }
}
