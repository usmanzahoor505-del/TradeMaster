using System.Security.Cryptography;
using System.Text;

namespace TradeMasterPro.Api.Helpers;

public static class EncryptionHelper
{
    private static byte[]? _keyBytes;

    public static void Initialize(string key)
    {
        using var sha256 = SHA256.Create();
        _keyBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(key));
    }

    public static string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return string.Empty;

        using var aes = Aes.Create();
        aes.Key = _keyBytes ?? throw new InvalidOperationException("EncryptionHelper is not initialized.");
        aes.GenerateIV(); // Generates a random 16-byte IV

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        
        ms.Write(aes.IV, 0, aes.IV.Length); // Prepend the 16-byte IV to the ciphertext

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public static string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return string.Empty;

        var fullCipher = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = _keyBytes ?? throw new InvalidOperationException("EncryptionHelper is not initialized.");

        var iv = new byte[16];
        var cipherBytes = new byte[fullCipher.Length - 16];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, 16); // Extract the IV
        Buffer.BlockCopy(fullCipher, 16, cipherBytes, 0, cipherBytes.Length); // Extract the ciphertext

        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(cipherBytes);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);

        return sr.ReadToEnd();
    }
}
