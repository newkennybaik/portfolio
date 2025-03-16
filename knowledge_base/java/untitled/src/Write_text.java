import java.io.*;

public class Write_text{
    public static void main(String[] args) throws IOException {
        BufferedWriter editor = new BufferedWriter(new FileWriter("output.txt"));
        editor.write("Java code has been tested,\nfor learning purposes. ");
        editor.write("I am pretty much sure it is going to work.\ntrust nobody but youself.\n");
        editor.write("File has been edited successfully as you intended.");
        editor.close();
    }
}
