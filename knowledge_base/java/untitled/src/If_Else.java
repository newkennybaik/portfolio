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