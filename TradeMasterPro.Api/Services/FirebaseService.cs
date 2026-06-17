using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace TradeMasterPro.Api.Services;

public class FirebaseService
{
    private readonly bool _isInitialized = false;

    public FirebaseService(IConfiguration config)
    {
        try
        {
            var credentialPath = config["Firebase:CredentialsPath"];
            if (!string.IsNullOrEmpty(credentialPath) && File.Exists(credentialPath))
            {
                using (var stream = new FileStream(credentialPath, FileMode.Open, FileAccess.Read))
                {
                    FirebaseApp.Create(new AppOptions()
                    {
                        Credential = GoogleCredential.FromStream(stream)
                    });
                }
                _isInitialized = true;
                Console.WriteLine("Firebase Admin SDK successfully initialized.");
            }
            else
            {
                Console.WriteLine("Warning: Firebase CredentialsPath not found or empty. Push notifications will run in mock mode.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Firebase Initialization Error: {ex.Message}. Push notifications will run in mock mode.");
        }
    }

    public async Task SendNotificationToUsersAsync(List<string> tokens, string title, string body)
    {
        if (tokens == null || tokens.Count == 0)
        {
            return;
        }

        // Clean out any null or empty tokens
        var cleanTokens = new List<string>();
        foreach (var t in tokens)
        {
            if (!string.IsNullOrWhiteSpace(t))
            {
                cleanTokens.Add(t.Trim());
            }
        }

        if (cleanTokens.Count == 0)
        {
            return;
        }

        if (!_isInitialized)
        {
            Console.WriteLine($"[Mock FCM Push] Title: '{title}', Body: '{body}', Target Tokens Count: {cleanTokens.Count}");
            foreach (var token in cleanTokens)
            {
                Console.WriteLine($"  -> Token: {token}");
            }
            return;
        }

        try
        {
            var message = new MulticastMessage()
            {
                Tokens = cleanTokens,
                Notification = new Notification()
                {
                    Title = title,
                    Body = body
                }
            };

            var response = await FirebaseMessaging.DefaultInstance.SendEachForMulticastAsync(message);
            Console.WriteLine($"FCM Push sent: {response.SuccessCount} successful, {response.FailureCount} failed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending FCM Multicast Message: {ex.Message}");
        }
    }
}
