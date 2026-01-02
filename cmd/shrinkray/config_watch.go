package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/gwlsn/shrinkray/internal/api"
	"github.com/gwlsn/shrinkray/internal/config"
)

type configReloadOptions struct {
	mediaOverride string
	queueFile     string
}

func startConfigWatcher(ctx context.Context, cfgPath string, handler *api.Handler, cfg *config.Config, opts configReloadOptions) {
	if cfgPath == "" {
		return
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("Warning: Failed to start config watcher: %v", err)
		return
	}

	watchDir := filepath.Dir(cfgPath)
	if err := watcher.Add(watchDir); err != nil {
		log.Printf("Warning: Failed to watch config directory %s: %v", watchDir, err)
		_ = watcher.Close()
		return
	}

	cfgPathAbs, err := filepath.Abs(cfgPath)
	if err != nil {
		cfgPathAbs = cfgPath
	}

	reloadCh := make(chan struct{}, 1)
	go func() {
		defer watcher.Close()

		var timer *time.Timer
		triggerReload := func() {
			if timer != nil {
				timer.Stop()
			}
			timer = time.AfterFunc(250*time.Millisecond, func() {
				newCfg, err := config.Load(cfgPath)
				if err != nil {
					log.Printf("Warning: Failed to reload config from %s: %v", cfgPath, err)
					return
				}
				if opts.mediaOverride != "" {
					newCfg.MediaPath = opts.mediaOverride
				}
				if opts.queueFile != "" {
					newCfg.QueueFile = opts.queueFile
				}

				if newCfg.MediaPath == "" {
					newCfg.MediaPath = cfg.MediaPath
				}
				if _, err := os.Stat(newCfg.MediaPath); err != nil {
					log.Printf("Warning: Ignoring config reload, media path unavailable: %s (%v)", newCfg.MediaPath, err)
					return
				}

				handler.ApplyConfig(newCfg)
				log.Printf("Config reloaded from %s", cfgPath)
			})
		}

		for {
			select {
			case <-ctx.Done():
				if timer != nil {
					timer.Stop()
				}
				return
			case <-reloadCh:
				triggerReload()
			case event, ok := <-watcher.Events:
				if !ok {
					return
				}
				if event.Op&(fsnotify.Write|fsnotify.Create|fsnotify.Rename) == 0 {
					continue
				}
				eventPath, err := filepath.Abs(event.Name)
				if err != nil {
					eventPath = event.Name
				}
				if eventPath != cfgPathAbs {
					continue
				}
				select {
				case reloadCh <- struct{}{}:
				default:
				}
			case err, ok := <-watcher.Errors:
				if !ok {
					return
				}
				log.Printf("Warning: Config watcher error: %v", err)
			}
		}
	}()
}
