# Java Basic Overview
  - For reminding 5 years ago school project.
  
# Java 주요 구문 & 예제

## 1. 변수 & 데이터 타입 선언 (Variable & Data Type)
'''java
public class Variable_DataType {
    public static void main(String[] args) {
        int age = 33;
        double height = 160.5;
        String name = "백진규";
        boolean isAdult = true;

        System.out.println("이름: " + name);
        System.out.println("나이: " + age);
        System.out.println("키: " + height + "cm");
        System.out.println("성인 여부: " + isAdult);
    }
}

## 2. if-else 문
'''java
public class If_Else {
    public static void main(String[] args) {
        int houseprice = 15;

        if (houseprice >= 50) {
            System.out.println("금수저");
        } else if (houseprice >= 30) {
            System.out.println("은수저");
        } else if (houseprice >= 15) {
            System.out.println("동수저");
        } else if (houseprice >= 5) {
            System.out.println("흙수저");
        } else
            System.out.println("거지");
    }
}
	
## 3. switch 문
'''java
public class Switch {
    public static void main(String[] args) {
        int answer = 2;

        switch (answer) {
            case 0:
                System.out.println("OFF");
                break;
            case 1:
                System.out.println("ON");
                break;
            case 2:
                System.out.println("ONE_OF_A_KIND");
                break;
            case 3:
                System.out.println("MADNESS");
            default:
                System.out.println("ABORT");
        }
    }
}

## 4. 반복문 (for, while, do-while)
	
	4.1 for문 (반복 실행)
'''java
public class For {
    public static void main(String[] args) {
        for (int i = 2; i <= 10; i++) {
            System.out.println("현재 숫자: " + i);
        }
    }
}

// 특정 횟수만큼 반복할 때 가장 많이 사용됨

	
	4.2 while문
'''java
public class While {
    public static void main(String[] args) {
        int smash = 5;
        while (smash <= 20){
            System.out.println("층간소음: 쿵쾅! " + smash);
            smash++;
        }
    }
}

// 특정 조건이 충족될 때까지 반복하는 코드

## 5. Array, Arraylist (배열 & 리스트)

	5.1 Array
'''java	
public class Array {
    public static void main(String[] args) {
        String[] language = {"한국어", "중국어", "영어", "일본어"};

        for (int i = 0; i < language.length; i++){
            System.out.println(language[i]);
        }
    }
}

	5.2 ArrayList
'''java	
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

## 6. 메서드(함수), 기본 메서드 선언 & 사용
'''java
public class Method{
    public static void main(String[] args) {
        guiltyPleas("치킨");
    }
    public static void guiltyPleas(String cuisine) {
        System.out.println("오늘은 " + cuisine + "이다!");
    }
}

## 7. 예외 처리 (try-catch)
'''java
public class Try_catch {
    public static void main(String[] args) {
        try {
            int result = 10 / 0; // 0으로 나누기 -> 오류 발생
        } catch (ArithmeticException e) {
            System.out.println("0으로 나누는건 ㄴㄴ");
        }
    }
}

## 8. 파일 입출력 (파일 읽기 & 쓰기)

	8.1 출력 (파일은 ./untitled/src/Read_text.java 이므로 src 바깥에 위치)
'''java	
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

	8.2 입력 (파일은 ./untitled/src/Write_text.java 이므로 src 바깥에 output.txt 생성됨.)
'''java
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

# Conclusion

## Java 기본 구문 정리
	✅ 변수 & 데이터 타입 (int, double, String, boolean)
	✅ 조건문 (if-else, switch)
	✅ 반복문 (for, while)
	✅ 배열 & 리스트 (Array, ArrayList)
	✅ 메서드 (함수) (public static void method())
	✅ 예외 처리 (try-catch)
	✅ 파일 입출력 (BufferedReader, BufferedWriter)