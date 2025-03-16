import java.util.ArrayList;

public class Array_List {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();
        list.add("한국어");
        list.add("중국어");
        list.add("영어");
        list.add("일본어");

        for (String language : list) {
            System.out.println(language);
        }
    }
}
