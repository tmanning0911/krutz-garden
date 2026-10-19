package com.kutz.lanpack;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import net.minecraft.client.Minecraft;
import net.minecraft.client.server.IntegratedServer;
import net.minecraft.server.MinecraftServer;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Used only when the game is started with -Dlanpackhost.test=true.
 * Opens the loaded world to LAN, then closes the game after the pack host has had time to start.
 */
@Mixin(Minecraft.class)
public abstract class MinecraftMixin {
	private int lanpackhost$ticks;
	private int lanpackhost$publishedAt = -1;

	@Inject(method = "tick", at = @At("HEAD"))
	private void lanpackhost$exerciseLan(CallbackInfo callback) {
		if (!Boolean.getBoolean("lanpackhost.test")) {
			return;
		}
		this.lanpackhost$ticks++;
		Minecraft minecraft = (Minecraft) (Object) this;
		IntegratedServer server = minecraft.getSingleplayerServer();
		if (server == null || minecraft.getConnection() == null) {
			return;
		}
		if (!server.isPublished() && this.lanpackhost$ticks % 40 == 0) {
			boolean opened = server.publishServer(MinecraftServer.MultiplayerScope.LAN, true, 25565);
			note("publish attempt tick " + this.lanpackhost$ticks + " opened=" + opened + " published=" + server.isPublished() + " port=" + server.getPort());
		}
		if (server.isPublished() && this.lanpackhost$publishedAt < 0) {
			this.lanpackhost$publishedAt = this.lanpackhost$ticks;
		}
		if (!Boolean.getBoolean("lanpackhost.keep") && this.lanpackhost$publishedAt >= 0 && this.lanpackhost$ticks > this.lanpackhost$publishedAt + 600) {
			note("test window closing after LAN publish");
			minecraft.stop();
		}
	}

	private static void note(String message) {
		try {
			Files.writeString(Path.of("/tmp/lanpack-test.log"), message + "\n", StandardOpenOption.CREATE, StandardOpenOption.APPEND);
		} catch (Throwable ignored) {
		}
	}
}
