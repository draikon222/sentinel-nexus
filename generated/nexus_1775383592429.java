public class Repository {
  // ...

  public void trimiteComanda(String comanda) {
    // Trimite comanda către Android
    Intent intent = new Intent("com.example.COMANDA");
    intent.putExtra("comanda", comanda);
    LocalBroadcastManager.getInstance(context).sendBroadcast(intent);
  }
}
