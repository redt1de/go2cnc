import { useContext } from 'react';
import { CncjsContext } from './CncjsProvider';

export default function useCncjs() {
    return useContext(CncjsContext);
}
