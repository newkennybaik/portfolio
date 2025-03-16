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