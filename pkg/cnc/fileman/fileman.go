package fileman

type FileManager interface {
	List(path string) (FileList, error) //CHANGED
	Read(path string) (string, error)
	Write(name, content string) error
	Delete(path string) error
	MkDir(path string) error
	RmDir(path string) error
}

type FileList struct {
	Files []FileInfo `json:"files"`
	Path  string     `json:"path"`
}

type FileInfo struct {
	Name string `json:"name"` // relative path
	Path string `json:"path"` // absolute path
	Size string `json:"size"` // Note: size is a string in the JSON,-1 indicates directory
}
