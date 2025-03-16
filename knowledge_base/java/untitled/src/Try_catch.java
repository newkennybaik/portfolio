public class Try_catch {
    public static void main(String[] args) {
        try {
            int result = 10 / 0; // 0으로 나누기 -> 오류 발생
        } catch (ArithmeticException e) {
            System.out.println("0으로 나누는건 ㄴㄴ");
        }
    }
}
