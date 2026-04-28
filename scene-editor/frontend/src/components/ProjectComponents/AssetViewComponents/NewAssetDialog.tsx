import React, { useState, useEffect } from 'react';

import { concat } from 'lodash'

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import axios from "axios";
import NewAssetDropzone from './NewAssetDropzone';


type NewAssetDialog = {
  activeProject: string;
  open: boolean;
  closeHandler: any;
  onAssetCreated: any;
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} variant="filled" ref={ref} {...props} />;
});

const NewAssetDialog: React.FC<NewAssetDialog> = ({ activeProject, open, closeHandler, onAssetCreated }) => {
  const [showProgress, setShowProgess] = useState(false);
  const [files, setFiles] = useState([] as any[])
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertProps['severity']>('info');

  const openSnackbar = (message: string, severity: AlertProps['severity']) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }

  const isMp4File = (file: File) => {
    const lowerName = file.name.toLowerCase();
    return lowerName.endsWith('.mp4') || file.type === 'video/mp4';
  }

  const isLikely360Mp4 = (file: File) => {
    return new Promise<boolean>((resolve) => {
      const video = document.createElement('video');
      const objectUrl = URL.createObjectURL(file);

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      }

      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const ratio = height === 0 ? 0 : width / height;

        cleanup();
        resolve(Math.abs(ratio - 2) <= 0.08);
      }
      video.onerror = () => {
        cleanup();
        resolve(false);
      }

      video.src = objectUrl;
    });
  }

  const resetForm = () => {
    setShowProgess(false);
    setFiles([]);
  }

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open])

  const handleClose = () => {
    if (showProgress) {
      return;
    }

    closeHandler(false)
  }

  const createAsset = async () => {
    if (files.length === 0) {
      return;
    }

    setShowProgess(true);

    const requests = files.map((file: any) => {
      const data = new FormData();
      // @ts-ignore: 
      data.append("file", file)

      return axios.post(`/api/project/${activeProject}/assets?name=${file.name}`, data)
    })

    Promise.all(requests)
      .then(() => {
        setShowProgess(false);
        openSnackbar('Assets created successfully.', 'success');
        onAssetCreated();
        closeHandler(false)
      })
      .catch((e) => {
        setShowProgess(false);
        openSnackbar('Failed to create assets. Please try again.', 'error');
        console.log(e)
      });
  };

  const removeElement = (index: number) => {
    return files.reduce((acc: any[], elem: any, i: number) => {
      if (i === index) {
        return acc;
      }

      return concat(acc, elem);
    }, [])
  }

  const renderFileChips = () => files.map((file: any, i) => {
    return (
      <Grid key={`chip-${i}`} item xs={12}>
        <Chip
          size="small"
          key={`file-${i}`}
          style={{ marginTop: 10, marginBottom: 10 }}
          label={file.name}
          onDelete={() => setFiles(removeElement(i))}
        />
      </Grid>
    )
  })

  const addFiles = async (selectedFiles: any[]) => {
    if (showProgress) {
      return;
    }

    const validFiles: any[] = [];
    const rejectedNames: string[] = [];

    for (const selectedFile of selectedFiles) {
      const file = selectedFile as File;
      if (isMp4File(file)) {
        const is360 = await isLikely360Mp4(file);
        if (!is360) {
          rejectedNames.push(file.name);
          continue;
        }
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles((existingFiles) => [...existingFiles, ...validFiles]);
      openSnackbar(`Added ${validFiles.length} file(s).`, 'success');
    }

    if (rejectedNames.length > 0) {
      openSnackbar(`Rejected non-360 mp4 file(s): ${rejectedNames.join(', ')}`, 'error');
    }
  }

  return (
    <>
      <Dialog open={open} aria-labelledby="form-dialog-title" onClose={handleClose} disableEscapeKeyDown={showProgress}>
        <DialogTitle id="form-dialog-title">New Asset</DialogTitle>
        <DialogContent>
          <Grid container style={{ maxHeight: '200px', width: '200px', marginBottom: '20px', overflow: 'auto' }}>
            {renderFileChips()}
          </Grid>
          <NewAssetDropzone onFileSelect={addFiles} />
        </DialogContent>
        {showProgress ? <LinearProgress /> : ""}
        <DialogActions>
          <Button onClick={handleClose} color="primary" disabled={showProgress}>
            Cancel
          </Button>
          <Button onClick={createAsset} color="primary" disabled={files.length === 0 || showProgress}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
export default NewAssetDialog;
